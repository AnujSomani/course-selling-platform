const { Router } = require("express");
const adminRouter = Router();
const mongoose = require("mongoose");
const { adminModel, courseModel, contentModel } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_ADMIN } = require("../config");
const { signupSchema, signinSchema } = require("../validation");
const { adminMiddleware } = require("../middlewares/admin");
const { startEmailVerification, verifyEmailCode } = require("../emailVerification");
const { authLimiter, resendLimiter } = require("../middlewares/rateLimiter");

adminRouter.post("/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
  }

  const { firstname, lastname, email, password } = parsed.data;

  try {
    const existing = await adminModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await adminModel.create({ firstname, lastname, email, password: hashedPassword });

    const emailResult = await startEmailVerification({
      model: adminModel,
      email,
      firstName: firstname,
      subjectPrefix: "Verify your admin account",
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

adminRouter.post("/signin", authLimiter, async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
  }

  const { email, password } = parsed.data;

  try {
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!admin.isEmailVerified) {
      return res.status(403).json({
        message: "Email not verified",
        requiresEmailVerification: true,
      });
    }

    const token = jwt.sign({ id: admin._id }, JWT_SECRET_ADMIN, { expiresIn: "7d" });
    return res.status(200).json({
      token,
      message: "Signed in successfully",
      firstname: admin.firstname,
      lastname: admin.lastname,
    });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/verify-email", authLimiter, async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: "email and code are required" });
  }

  const result = await verifyEmailCode({ model: adminModel, email, code });
  if (result.status !== 200) {
    return res.status(result.status).json({ message: result.message });
  }

  const admin = await adminModel.findOne({ email });
  const token = jwt.sign({ id: admin._id }, JWT_SECRET_ADMIN, { expiresIn: "7d" });
  return res.status(200).json({
    message: result.message,
    token,
    firstname: admin.firstname,
    lastname: admin.lastname,
  });
});

adminRouter.post("/resend-verification-code", resendLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }
  const result = await startEmailVerification({
    model: adminModel,
    email,
    subjectPrefix: "Verify your admin account",
  });
  return res.status(result.status).json({ message: result.message });
});


adminRouter.get("/bulk", adminMiddleware, async (req, res) => {
  try {
    const courses = await courseModel.find({ creatorId: req.userId });
    return res.status(200).json({ message: "Courses fetched successfully", courses });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/courses", adminMiddleware, async (req, res) => {
  const { title, description, imageUrl, price, category, level, originalPrice } = req.body;

  if (!title || !description || price === undefined) {
    return res.status(400).json({ message: "title, description and price are required" });
  }

  try {
    const course = await courseModel.create({
      title,
      description,
      imageUrl,
      price,
      category: category || "",
      level: level || "Beginner",
      ...(originalPrice !== undefined ? { originalPrice } : {}),
      creatorId: req.userId,
    });

    return res.status(201).json({ message: "Course created successfully", courseId: course._id });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/courses", adminMiddleware, async (req, res) => {
  const { courseId, title, description, imageUrl, price, category, level, originalPrice } = req.body;

  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  try {
    const course = await courseModel.findOne({ _id: courseId, creatorId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or not yours" });
    }

    await courseModel.updateOne(
      { _id: courseId, creatorId: req.userId },
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(level !== undefined && { level }),
        ...(originalPrice !== undefined && { originalPrice }),
      }
    );

    return res.status(200).json({ message: "Course updated successfully", courseId });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.delete("/courses/:courseId", adminMiddleware, async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ error: "Invalid courseId format" });
  }

  try {
    const course = await courseModel.findOne({ _id: courseId, creatorId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or not yours" });
    }

    await contentModel.deleteMany({ courseId });
    await courseModel.deleteOne({ _id: courseId });

    return res.status(200).json({ message: "Course deleted successfully", courseId });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/courses/:courseId/content", adminMiddleware, async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await courseModel.findOne({ _id: courseId, creatorId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const contents = await contentModel
      .find({ courseId })
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({ message: "Course contents", contents });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/courses/:courseId/content", adminMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const { type, title, url, text, order, isPreview, metadata } = req.body;

  try {
    const course = await courseModel.findOne({ _id: courseId, creatorId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!type || !title) {
      return res.status(400).json({ message: "type and title are required" });
    }
    if (type === "text" && !text) {
      return res.status(400).json({ message: "text field is required for text content" });
    }
    if (type !== "text" && !url) {
      return res.status(400).json({ message: "url is required for non-text content" });
    }

    const content = await contentModel.create({
      courseId,
      type,
      title,
      url,
      text,
      order: order ?? 0,
      isPreview: !!isPreview,
      metadata: metadata ?? {},
    });

    return res.status(201).json({ message: "Content created", contentId: content._id });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/content/:contentId", adminMiddleware, async (req, res) => {
  const { contentId } = req.params;

  try {
    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const course = await courseModel.findOne({ _id: content.courseId, creatorId: req.userId });
    if (!course) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { type, title, url, text, order, isPreview, metadata } = req.body;
    await contentModel.updateOne(
      { _id: contentId },
      {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(text !== undefined && { text }),
        ...(order !== undefined && { order }),
        ...(isPreview !== undefined && { isPreview: !!isPreview }),
        ...(metadata !== undefined && { metadata }),
      }
    );

    return res.status(200).json({ message: "Content updated", contentId });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.delete("/content/:contentId", adminMiddleware, async (req, res) => {
  const { contentId } = req.params;

  try {
    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const course = await courseModel.findOne({ _id: content.courseId, creatorId: req.userId });
    if (!course) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await contentModel.deleteOne({ _id: contentId });
    return res.status(200).json({ message: "Content deleted", contentId });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/change-password", adminMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  try {
    const admin = await adminModel.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await adminModel.updateOne({ _id: req.userId }, { password: hashed });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { adminRouter };
