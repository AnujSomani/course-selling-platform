const mongoose = require ("mongoose");
const Schema = mongoose.Schema;
const objectId = mongoose.Schema.Types.ObjectId;

const userSchema = new Schema({
   email : {type:String,unique:true},
   password : String,
   firstname : String,
   lastname : String,
   isEmailVerified: { type: Boolean, default: false, index: true },
   emailVerifiedAt: { type: Date },
   emailVerification: {
      codeHash: { type: String },
      expiresAt: { type: Date },
   },
}) ;

const adminSchema = new Schema({
    email : {type:String,unique:true},
    password : String,
    firstname : String,
    lastname : String,
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date },
    emailVerification: {
       codeHash: { type: String },
       expiresAt: { type: Date },
    },
});

const courseSchema =  new Schema ({
    price : Number,
    description : String,
    title : String,
    imageUrl : String,
    creatorId : {type:objectId , ref : "admin"}
});

const purchaseSchema = new Schema ({
    userId :{type : objectId, ref : "user" },
    courseId : {type : objectId, ref : "course"}
});

const contentSchema = new Schema(
    {
        courseId: { type: objectId, ref: "course", required: true, index: true },
        type: {
            type: String,
            enum: ["video", "pdf", "link", "text"],
            required: true,
        },
        title: { type: String, required: true },
        url: { type: String },
        text: { type: String },
        order: { type: Number, default: 0, index: true },
        isPreview: { type: Boolean, default: false, index: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

const userModel = mongoose.model("user", userSchema);
const adminModel = mongoose.model("admin", adminSchema);
const purchaseModel = mongoose.model("purchase", purchaseSchema);
const courseModel = mongoose.model("course", courseSchema);
const contentModel = mongoose.model("content", contentSchema);


module.exports = {
    userModel,
    adminModel,
    courseModel,
    purchaseModel,
    contentModel
};