const {Router} = require("express");
const courseRouter = Router();
const { purchaseModel, courseModel, contentModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");

courseRouter.get("/preview", async function(req,res){

   try {
    const courses = await courseModel.find({});
    return res.status(200).json({ message: "All courses", courses });
  } catch (e) {
    console.error("[courses-preview]", e);
    return res.status(500).json({ message: "Internal server error" });
  }

});

courseRouter.get("/:courseId/content/preview", async function (req, res) {
     try {
    const { courseId } = req.params;
    const contents = await contentModel
      .find({ courseId, isPreview: true })
      .sort({ order: 1, createdAt: 1 });
 
    return res.status(200).json({ message: "Preview content", contents });
  } catch (e) {
    console.error("[content-preview]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

courseRouter.post("/purchase", userMiddleware, async function(req, res) {
    const userId   = req.userId;
    const courseId = req.body.courseId;

    if (!courseId) {
        return res.status(400).json({ message: "courseId is required" });
    }

    try {
        // Fix #6: fetch course from DB before using course.price (was ReferenceError)
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Fix #18: only block re-purchase if a COMPLETED purchase already exists
        const existing = await purchaseModel.findOne({
            userId,
            courseId,
            status: "completed",  // was missing — "failed"/"pending" was also blocking
        });
        if (existing) {
            return res.status(200).json({ message: "Course already purchased" });
        }

        // Paid courses must go through Razorpay
        if (course.price > 0) {
            return res.status(400).json({
                message: "This is a paid course. Use /api/v1/payment/create-order to purchase.",
            });
        }

        // Fix #17: wrapped in try/catch — free course purchase (price === 0)
        await purchaseModel.create({
            userId,
            courseId,
            status:   "completed",
            amount:   0,
            currency: "INR",
            // razorpayOrderId intentionally omitted for free courses (sparse index allows it)
        });

        return res.status(201).json({ message: "Course enrolled successfully" });
    } catch (e) {
        console.error("[purchase]", e);
        return res.status(500).json({ message: "Internal server error" });
    }

});

module.exports = ({
    courseRouter:courseRouter
})