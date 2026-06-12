const { Router } = require("express");
const adminRouter = Router();
const { adminModel, courseModel, contentModel } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_ADMIN } = require("../config");
const { signupSchema, signinSchema } = require("../validation");
const { adminMiddleware } = require("../middlewares/admin");
const { startEmailVerification, verifyEmailCode } = require("../emailVerification");
const { authLimiter, resendLimiter } = require("../middlewares/rateLimiter");

adminRouter.post("/signup", authLimiter, async function (req, res) {
  const parsedData = signupSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsedData.error.errors,
    });
  }

  const { firstname, lastname, email, password } = parsedData.data;

  try {
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await adminModel.create({ firstname, lastname, email, password: hashedPassword });

    await startEmailVerification({
      model: adminModel,
      email,
      firstName: firstname,
      subjectPrefix: "Verify your admin account",
    });

    return res.status(201).json({
      message: "Signup successful. Verification code sent to email.",
      requiresEmailVerification: true,
    });
  } catch (e) {
    console.error("[admin-signup]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/signin", authLimiter, async function (req, res) {
  const parsedData = signinSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsedData.error.errors,
    });
  }

  const { email, password } = parsedData.data;

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

    return res.status(200).json({ token, message: "Signed in successfully" });
  } catch (e) {
    console.error("[admin-signin]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/verify-email", authLimiter, async function (req, res) {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: "email and code are required" });
  }
  const result = await verifyEmailCode({ model: adminModel, email, code });
  return res.status(result.status).json({ message: result.message });
});

adminRouter.post("/resend-verification-code", resendLimiter, async function (req, res) {
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

adminRouter.post("/courses", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { title, description, imageUrl, price } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ message: "title, description and price are required" });
    }

    const course = await courseModel.create({
      title,
      description,
      imageUrl,
      price,
      creatorId: adminId,
    });

    return res.status(201).json({
      message: "Course created successfully",
      courseId: course._id,
    });
  } catch (e) {
    console.error("[create-course]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/courses", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { courseId, title, description, imageUrl, price } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await courseModel.findOne({ _id: courseId, creatorId: adminId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or not yours" });
    }

    await courseModel.updateOne(
      { _id: courseId, creatorId: adminId },
      {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(price !== undefined ? { price } : {}),
      }
    );

    return res.status(200).json({ message: "Course updated successfully", courseId });
  } catch (e) {
    console.error("[update-course]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/bulk", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const courses = await courseModel.find({ creatorId: adminId });

    return res.status(200).json({ message: "Courses fetched successfully", courses });
  } catch (e) {
    console.error("[bulk-courses]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/courses/:courseId/content", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { courseId } = req.params;
    const { type, title, url, text, order, isPreview, metadata } = req.body;

    const course = await courseModel.findOne({ _id: courseId, creatorId: adminId });
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
      order,
      isPreview: !!isPreview,
      metadata: metadata ?? {},
    });

    return res.status(201).json({ message: "Content created", contentId: content._id });
  } catch (e) {
    console.error("[create-content]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});
adminRouter.get("/courses/:courseId/content", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { courseId } = req.params;

    const course = await courseModel.findOne({ _id: courseId, creatorId: adminId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const contents = await contentModel
      .find({ courseId })
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({ message: "Course contents", contents });
  } catch (e) {
    console.error("[get-content]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/content/:contentId", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { contentId } = req.params;

    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const course = await courseModel.findOne({ _id: content.courseId, creatorId: adminId });
    if (!course) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { type, title, url, text, order, isPreview, metadata } = req.body;
    const update = {
      ...(type !== undefined ? { type } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(text !== undefined ? { text } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(isPreview !== undefined ? { isPreview: !!isPreview } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    };

    await contentModel.updateOne({ _id: contentId }, update);
    return res.status(200).json({ message: "Content updated", contentId });
  } catch (e) {
    console.error("[update-content]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.delete("/content/:contentId", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { contentId } = req.params;

    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const course = await courseModel.findOne({ _id: content.courseId, creatorId: adminId });
    if (!course) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await contentModel.deleteOne({ _id: contentId });
    return res.status(200).json({ message: "Content deleted", contentId });
  } catch (e) {
    console.error("[delete-content]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { adminRouter };