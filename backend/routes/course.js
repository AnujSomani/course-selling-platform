//one ugly way of routing is create function createcurseroute 
//keep all into it then export it and import it in index.js and call it

const {Router} = require("express");
const courseRouter = Router();
const { purchaseModel, courseModel, contentModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");

courseRouter.get("/preview", async function(req,res){

    const courses = await courseModel.find({});
    res.json({
        message:"all courses",
        courses
     })

});

courseRouter.get("/:courseId/content/preview", async function (req, res) {
    const { courseId } = req.params;
    const contents = await contentModel
        .find({ courseId, isPreview: true })
        .sort({ order: 1, createdAt: 1 });
    return res.json({ message: "preview content", contents });
});

courseRouter.post("/purchase", userMiddleware, async function(req,res){
    const userId = req.userId;
    const courseId = req.body.courseId;

    if (!courseId) {
        return res.status(400).json({ message: "courseId is required" });
    }

    const existing = await purchaseModel.findOne({ userId, courseId });
    if (existing) {
        return res.status(200).json({ message: "course already purchased" });
    }

    await purchaseModel.create({
        userId,
        courseId
    });
    res.json({
        message:"u have sucessfully bought the course"
     })

});

module.exports = ({
    courseRouter:courseRouter
})