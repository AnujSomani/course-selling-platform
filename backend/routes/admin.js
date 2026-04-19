const { Router } = require ("express");
const adminRouter = Router();
const { adminModel, courseModel, contentModel } = require("../db");
const bcrypt  = require("bcrypt");
const jwt = require("jsonwebtoken");
const {JWT_SECRET_ADMIN} = require("../config");
const {signupSchema,signinSchema} = require("../validation");
const {adminMiddleware }= require("../middlewares/admin")
const { startEmailVerification, verifyEmailCode } = require("../emailVerification");


adminRouter.post ("/signup", async function(req,res){

     const parsedData = signupSchema.safeParse(req.body);

      if (!parsedData.success){
        return res.status(404).json({
            message:"Invalid Input",
            errors :parsedData.error.errors
        });
      }
      const firstname = parsedData.data.firstname;
      const lastname = parsedData.data.lastname;
      const email = parsedData.data.email;
      const password = parsedData.data.password;

     
     try{
        const  existingAdmin = await adminModel.findOne({email:email});
     if(existingAdmin){
         return res.status(409).json({
             message:"Admin already exists"
         });
     }     
    const hashedPassword = await bcrypt.hash(password,10);    

         await adminModel.create({
             firstname:firstname,
             lastname:lastname,
             email:email,
             password:hashedPassword,
         });
         await startEmailVerification({
           model: adminModel,
           email,
           firstName: firstname,
           subjectPrefix: "Verify your admin account",
         });
         return res.status(201).json({
           message:"Signup successful. Verification code sent to email.",
           requiresEmailVerification: true,
         });
}catch(e){
         return res.status(500).json({
             message:"Error checking  existing user"
         });
    }
       
});

adminRouter.post ("/signin", async function(req,res){
   const parsedData = signinSchema.safeParse(req.body);
      if(!parsedData.success){
            return res.status(400).json({
              message: "Invalid Input",
              errors: parsedData.error.errors,
          });
      }
      const email = parsedData.data.email;
      const password = parsedData.data.password;
  
      try{
          const admin = await adminModel.findOne({email});
          if(!admin){
              return res.status(401).json({
                  message:"invalid credentials",
              })
          }
          const passwordMatch = await bcrypt.compare(password,admin.password);
          if(!passwordMatch){
               return res.status(401).json({ 
                  message: "Invalid credentials"
               });
          }
          if (!admin.isEmailVerified) {
            return res.status(403).json({
              message: "Email not verified",
              requiresEmailVerification: true,
            });
          }
        const token = jwt.sign({
          id:admin._id
        },JWT_SECRET_ADMIN);
        res.status(200).json({
          token:token,
          message:"signin sucessfully"
        })
       
      } catch (e) {
          return res.status(500).json({
               message: "Internal server error"
               });
      }
  });

adminRouter.post("/verify-email", async function (req, res) {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: "email and code are required" });
  }
  const result = await verifyEmailCode({ model: adminModel, email, code });
  return res.status(result.status).json({ message: result.message });
});

adminRouter.post("/resend-verification-code", async function (req, res) {
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

adminRouter.post ("/courses",adminMiddleware,async function(req,res){

    const adminId = req.userId;
    const {title,description,imageUrl,price} = req.body;

    const course = await courseModel.create({
          title:title,
          description:description,
          imageUrl:imageUrl,
          price:price,
          creatorId:adminId
    })
    res.json({
        message:"cource created sucessfully",
        courseId:course._id
    })
});

adminRouter.put ("/courses",adminMiddleware,async function(req,res){
    const adminId = req.userId;
    const { courseId, title, description, imageUrl, price } = req.body;
    if (!courseId) {
        return res.status(400).json({ message: "courseId is required" });
    }
    await courseModel.updateOne(
        {
            _id: courseId,
            creatorId: adminId,
        },
        {
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
            ...(price !== undefined ? { price } : {}),
        }
    );
    res.status(200).json({
        message : "course updated sucessfully",
        courseId: courseId
    })
});

adminRouter.get ("/bulk",adminMiddleware,async function(req,res){

    const adminId = req.userId;

    const courses = await courseModel.find({ creatorId: adminId });
    res.json({
        message:"get all the created courses",
        courses
    })
});

adminRouter.post("/courses/:courseId/content", adminMiddleware, async function (req, res) {
    const adminId = req.userId;
    const { courseId } = req.params;
    const { type, title, url, text, order, isPreview, metadata } = req.body;

    const course = await courseModel.findOne({ _id: courseId, creatorId: adminId });
    if (!course) {
        return res.status(404).json({ message: "course not found" });
    }
    if (!type || !title) {
        return res.status(400).json({ message: "type and title are required" });
    }
    if ((type === "text" && !text) || (type !== "text" && !url)) {
        return res.status(400).json({ message: "url required for non-text, text required for text type" });
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
    return res.status(201).json({ 
        message: "content created", contentId: content._id 
    });
});

adminRouter.get("/courses/:courseId/content", adminMiddleware, async function (req, res) {
    const adminId = req.userId;
    const { courseId } = req.params;
    const course = await courseModel.findOne({ _id: courseId, creatorId: adminId });
    if (!course) {
        return res.status(404).json({ message: "course not found" });
    }
    const contents = await contentModel
        .find({ courseId })
        .sort({ order: 1, createdAt: 1 });
    return res.json({ message: "course contents", contents });
});

adminRouter.put("/content/:contentId", adminMiddleware, async function (req, res) {
    const adminId = req.userId;
    const { contentId } = req.params;

    const content = await contentModel.findById(contentId);
    if (!content) {
        return res.status(404).json({ message: "content not found" });
    }
    const course = await courseModel.findOne({ _id: content.courseId, creatorId: adminId });
    if (!course) {
        return res.status(403).json({ message: "not allowed" });
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
    return res.json({ message: "content updated", contentId });
});

adminRouter.delete("/content/:contentId", adminMiddleware, async function (req, res) {
    const adminId = req.userId;
    const { contentId } = req.params;

    const content = await contentModel.findById(contentId);
    if (!content) {
        return res.status(404).json({ message: "content not found" });
    }
    const course = await courseModel.findOne({ _id: content.courseId, creatorId: adminId });
    if (!course) {
        return res.status(403).json({ message: "not allowed" });
    }

    await contentModel.deleteOne({ _id: contentId });
    return res.json({ message: "content deleted", contentId });
});

module.exports = {
    adminRouter:adminRouter
}