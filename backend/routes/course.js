const { Router } = require("express");
const courseRouter = Router();
const { purchaseModel, courseModel, contentModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");

courseRouter.get("/preview", async (_req, res) => {
  try {
    const courses = await courseModel.find({});
    return res.status(200).json({ message: "All courses", courses });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

courseRouter.get("/:courseId/content/preview", async (req, res) => {
  const { courseId } = req.params;
  try {
    const contents = await contentModel
      .find({ courseId, isPreview: true })
      .sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ message: "Preview content", contents });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

courseRouter.post("/purchase", userMiddleware, async (req, res) => {
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

    const existing = await purchaseModel.findOne({ userId, courseId, status: "completed" });
    if (existing) {
      return res.status(200).json({ message: "Course already purchased" });
    }

    if (course.price > 0) {
      return res.status(400).json({
        message: "This is a paid course. Use /api/v1/payment/create-order to purchase.",
      });
    }

    await purchaseModel.create({ userId, courseId, status: "completed", amount: 0, currency: "INR" });
    return res.status(201).json({ message: "Course enrolled successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { courseRouter };
