const { Router } = require("express");
const userRouter = Router();
const { signupSchema, signinSchema } = require("../validation");
const { userModel, purchaseModel, contentModel } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_USER } = require("../config");
const { userMiddleware } = require("../middlewares/user");
const { startEmailVerification, verifyEmailCode } = require("../emailVerification");
const { authLimiter, resendLimiter } = require("../middlewares/rateLimiter");

userRouter.post("/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid Input", errors: parsed.error.errors });
  }

  const { firstname, lastname, email, password } = parsed.data;

  try {
    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.create({ firstname, lastname, email, password: hashedPassword });

    const emailResult = await startEmailVerification({
      model: userModel,
      email,
      firstName: firstname,
      subjectPrefix: "Verify your account",
    });

    return res.status(201).json({
      message: emailResult.status === 200
        ? "Signup successful. Verification code sent to email."
        : emailResult.message,
      requiresEmailVerification: true,
    });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/signin", authLimiter, async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid Input", errors: parsed.error.errors });
  }

  const { email, password } = parsed.data;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Email not verified",
        requiresEmailVerification: true,
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET_USER, { expiresIn: "7d" });
    return res.status(200).json({
      token,
      message: "Signed in successfully",
      firstname: user.firstname,
      lastname: user.lastname,
    });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
userRouter.post("/verify-email", authLimiter, async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: "email and code are required" });
  }

  const result = await verifyEmailCode({ model: userModel, email, code });
  if (result.status !== 200) {
    return res.status(result.status).json({ message: result.message });
  }
  const user = await userModel.findOne({ email });
  const token = jwt.sign({ id: user._id }, JWT_SECRET_USER, { expiresIn: "7d" });
  return res.status(200).json({
    message: result.message,
    token,
    firstname: user.firstname,
    lastname: user.lastname,
  });
});

userRouter.post("/resend-verification-code", resendLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }
  const result = await startEmailVerification({
    model: userModel,
    email,
    subjectPrefix: "Verify your account",
  });
  return res.status(result.status).json({ message: result.message });
});


userRouter.get("/purchases", userMiddleware, async (req, res) => {
  try {
    const purchases = await purchaseModel
      .find({ userId: req.userId })
      .populate("courseId");

    return res.status(200).json({ message: "Purchases fetched successfully", purchases });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get("/courses/:courseId/content", userMiddleware, async (req, res) => {
  const { courseId } = req.params;

  try {
    const purchase = await purchaseModel.findOne({
      userId: req.userId,
      courseId,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({ message: "Course not purchased" });
    }

    const contents = await contentModel
      .find({ courseId })
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({ message: "Course content", contents });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.put("/change-password", userMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updateOne({ _id: req.userId }, { password: hashed });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { userRouter };
