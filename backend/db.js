const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const objectId = mongoose.Schema.Types.ObjectId;

const userSchema = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstname: String,
    lastname: String,
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date },
    emailVerification: {
        codeHash: { type: String },
        expiresAt: { type: Date },
    },
}, { timestamps: true });

const adminSchema = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstname: String,
    lastname: String,
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date },
    emailVerification: {
        codeHash: { type: String },
        expiresAt: { type: Date },
    },
}, { timestamps: true });

const courseSchema = new Schema({
    price: Number,
    description: String,
    title: String,
    imageUrl: String,
    creatorId: { type: objectId, ref: "admin" },
    category: { type: String, default: "" },
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner",
    },
    originalPrice: { type: Number },
    rating: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
});

const purchaseSchema = new Schema({
    userId: { type: objectId, ref: "user" },
    courseId: { type: objectId, ref: "course" },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        index: true,
    },
    webhookPayload: { type: Schema.Types.Mixed },
},
    { timestamps: true }
);
purchaseSchema.index(
    { userId: 1, courseId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "completed" },
        name: "unique_completed_purchase",
    }
);

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