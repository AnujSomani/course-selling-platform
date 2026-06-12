const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");

const razorpay = require("../config/razorpay");

const { userMiddleware } = require("../middlewares/user");
const { purchaseModel, courseModel } = require("../db");

router.post("/create-order", userMiddleware, async (req, res) => {
  const { courseId } = req.body;
  const userId = req.userId;

  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  try {
    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const alreadyPurchased = await purchaseModel.findOne({
      userId,
      courseId,
      status: "completed",
    });
    if (alreadyPurchased) {
      return res.status(400).json({ message: "Already purchased" });
    }

    const pendingOrder = await purchaseModel.findOne({
      userId,
      courseId,
      status: "pending",
    });
    if (pendingOrder) {
      return res.status(200).json({
        orderId: pendingOrder.razorpayOrderId,
        amount: Math.round(pendingOrder.amount * 100),
        currency: pendingOrder.currency,
        courseName: course.title,
        courseImage: course.imageUrl,
        keyId: process.env.RAZORPAY_KEY_ID,
        resumed: true,
      });
    }

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(course.price * 100),
      currency: "INR",
      receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        courseId: courseId.toString(),
      },
    });

    await purchaseModel.create({
      userId,
      courseId,
      razorpayOrderId: rpOrder.id,
      amount: course.price,
      currency: "INR",
      status: "pending",
    });

    return res.status(200).json({
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      courseName: course.title,
      courseImage: course.imageUrl,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Order already in progress" });
    }
    console.error("[create-order]", err);
    return res.status(500).json({ message: "Order creation failed" });
  }
});

async function completePurchase({ razorpayOrderId, razorpayPaymentId, payload }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const alreadyProcessed = await purchaseModel
      .findOne({ razorpayPaymentId })
      .session(session);

    if (alreadyProcessed) {
      await session.abortTransaction();
      session.endSession();
      return { status: "already_processed" };
    }

    const updated = await purchaseModel.findOneAndUpdate(
      { razorpayOrderId, status: "pending" },
      {
        $set: {
          razorpayPaymentId,
          status: "completed",
          webhookPayload: payload,
        },
      },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      session.endSession();
      return { status: "race_handled" };
    }

    await courseModel.findByIdAndUpdate(
      updated.courseId,
      { $inc: { totalStudents: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return { status: "ok" };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.code === 11000) {
      return { status: "duplicate_handled" };
    }
    throw err;
  }
}

async function paymentWebhookHandler(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSig) {
    console.warn("[webhook] Invalid signature — possible spoofed request");
    return res.status(400).json({ message: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  console.log(`[webhook] event: ${event.event}`);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    try {
      const result = await completePurchase({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        payload: event.payload,
      });
      console.log(`[webhook] completePurchase result: ${result.status} — paymentId: ${payment.id}`);
      return res.json(result);
    } catch (err) {
      console.error("[webhook] Transaction failed:", err);
      return res.status(500).json({ message: "Processing failed" });
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;
    await purchaseModel.findOneAndUpdate(
      { razorpayOrderId: payment.order_id, status: "pending" },
      { $set: { status: "failed", webhookPayload: event.payload } }
    );
    console.log(`[webhook] Payment failed: ${payment.order_id}`);
    return res.json({ status: "ok" });
  }
  return res.json({ status: "ignored" });
}

router.post("/verify", userMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment verification fields" });
  }

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  const pending = await purchaseModel.findOne({
    razorpayOrderId: razorpay_order_id,
    userId: req.userId,
    status: "pending",
  });

  if (!pending) {
    const completed = await purchaseModel.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.userId,
      status: "completed",
    });
    if (completed) {
      return res.status(200).json({ message: "Payment already verified", status: "already_processed" });
    }
    return res.status(404).json({ message: "Pending purchase not found" });
  }

  try {
    const result = await completePurchase({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      payload: { source: "client_verify" },
    });
    return res.status(200).json({ message: "Payment verified", ...result });
  } catch (err) {
    console.error("[verify]", err);
    return res.status(500).json({ message: "Verification failed" });
  }
});
router.get("/verify-purchase/:courseId", userMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const purchase = await purchaseModel.findOne({
      userId,
      courseId,
      status: "completed",
    });

    return res.status(200).json({ purchased: !!purchase });
  } catch (err) {
    console.error("[verify-purchase]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
module.exports.paymentWebhookHandler = paymentWebhookHandler;