// const express = require("express");
// const Router = express.Router;
          //OR
const{Router} = require("express");
const userRouter = Router();
const {signupSchema,signinSchema,} = require("../validation");
const { userModel, purchaseModel, contentModel } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {JWT_SECRET_USER} = require("../config");
const { userMiddleware } = require("../middlewares/user");
const { startEmailVerification, verifyEmailCode } = require("../emailVerification");
//const { userAuth }        = require("../middleware/userAuth");



userRouter.post("/signup",async function(req,res){
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
        const  existingUser = await userModel.findOne({email:email});
     if(existingUser){
         return res.status(409).json({
             message:"User already exists"
         });
     }     
    const hashedPassword = await bcrypt.hash(password,10);    

         await userModel.create({
             firstname:firstname,
             lastname:lastname,
             email:email,
             password:hashedPassword,
         });
          await startEmailVerification({
            model: userModel,
            email,
            firstName: firstname,
            subjectPrefix: "Verify your account",
          });
          return res.status(201).json({
            message:"Signup successful. Verification code sent to email.",
            requiresEmailVerification: true
          });
}catch(e){
  console.log(e);
         return res.status(500).json({
             message:"Error checking  existing user"
         });
    
}
});

userRouter.post("/signin",async function(req,res){

    const parsedData = signinSchema.safeParse(req.body);
    if(!parsedData.success){
          return res.status(404).json({
            message: "Invalid Input",
            errors: parsedData.error.errors,
        });
    }
    const email = parsedData.data.email;
    const password = parsedData.data.password;

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(401).json({
                message:"invalid credentials",
            })
        }
        const passwordMatch = await bcrypt.compare(password,user.password);
        if(!passwordMatch){
             return res.status(401).json({ 
                message: "Invalid credentials"
             });
        }
        if (!user.isEmailVerified) {
          return res.status(403).json({
            message: "Email not verified",
            requiresEmailVerification: true,
          });
        }
      const token = jwt.sign({
        id:user._id
      },JWT_SECRET_USER);
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

userRouter.post("/verify-email", async function (req, res) {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: "email and code are required" });
  }
  const result = await verifyEmailCode({ model: userModel, email, code });
  return res.status(result.status).json({ message: result.message });
});

userRouter.post("/resend-verification-code", async function (req, res) {
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

userRouter.get("/purchases", userMiddleware, async function(req,res){
  try{
    const purchase = await purchaseModel.find({
        userId:req.userId
    }).populate("courseId");

    return res.status(200).json({
        message : "purchases fetched successfully",
        purchases: purchase
    })
  }catch{
    res.status(500).json({
     message: "internal server error"
    })
  }

});

userRouter.get("/courses/:courseId/content", userMiddleware, async function (req, res) {
  try {
    const { courseId } = req.params;
    const hasPurchased = await purchaseModel.findOne({
      userId: req.userId,
      courseId,
    });

    if (!hasPurchased) {
      return res.status(403).json({ message: "course not purchased" });
    }

    const contents = await contentModel
      .find({ courseId })
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({ message: "course content", contents });
  } catch (e) {
    return res.status(500).json({ message: "internal server error" });
  }
});

module.exports = ({
    userRouter:userRouter
})
