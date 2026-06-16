require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");

const uploadRouter = require("./routes/upload");
const streamRouter = require("./routes/stream");

const paymentRouter = require("./routes/payment");
const { paymentWebhookHandler } = require("./routes/payment");

// ── Startup: validate required environment variables ─────────────────────────
const REQUIRED_ENV = [
    "JWT_SECRET_USER",
    "JWT_SECRET_ADMIN",
    "MONGO_URI",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "CLOUDFRONT_DOMAIN",
    "CLOUDFRONT_KEY_PAIR_ID",
    "CLOUDFRONT_PRIVATE_KEY",
    "FRONTEND_URL",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// Trust the first proxy hop so express-rate-limit sees real client IPs
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));

// IMPORTANT: webhook route MUST be registered before express.json()
// so the raw body is available for HMAC signature verification.
app.post(
    "/api/v1/payment/webhook",
    express.raw({ type: "application/json" }),
    paymentWebhookHandler
);

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/stream", streamRouter);
app.use("/api/v1/payment", paymentRouter);

// ── Global error handler (must be last app.use) ───────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("[error]", err.message);
    res.status(500).json({ error: "Internal server error" });
});
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
    const PORT = process.env.PORT || 3005;
    app.listen(PORT);
    console.log(`Server listening on port ${PORT}`);
}

main();