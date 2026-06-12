// Fix #2: dotenv MUST be the very first line so process.env is available
//         to all imports that follow (cors origin, config.js, etc.)
require("dotenv").config();

const express  = require("express");
const cors     = require("cors");     // Fix #1: was used but never imported → ReferenceError
const mongoose = require("mongoose");

// Named-export routers (user, course, admin use module.exports = { router })
const { userRouter }   = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter }  = require("./routes/admin");

// Fix #8: upload & stream use default export (module.exports = router)
//         Destructuring { uploadRouter } / { streamRouter } gives undefined — fixed here
const uploadRouter  = require("./routes/upload");
const streamRouter  = require("./routes/stream");

// Fix #9 + Fix #14: paymentRouter declared here so we can register the
//                   webhook BEFORE express.json() (webhook needs raw Buffer body)
const paymentRouter          = require("./routes/payment");
const { paymentWebhookHandler } = require("./routes/payment");

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));

// ─── WEBHOOK (raw body required for HMAC verification) ───────────────────────
// Fix #9 & #14: MUST be registered BEFORE express.json() because
//   express.raw() and express.json() are mutually exclusive on the same route.
//   If express.json() ran first, req.body would be a parsed object — not a
//   Buffer — and the HMAC signature check in paymentWebhookHandler would fail.
app.post(
    "/api/v1/payment/webhook",
    express.raw({ type: "application/json" }),
    paymentWebhookHandler
);

// ─── JSON BODY PARSER (all other routes) ─────────────────────────────────────
app.use(express.json());

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/v1/user",    userRouter);
app.use("/api/v1/admin",   adminRouter);
app.use("/api/v1/course",  courseRouter);
app.use("/api/v1/upload",  uploadRouter);
app.use("/api/v1/stream",  streamRouter);  // Fix #8: was never mounted
app.use("/api/v1/payment", paymentRouter);

// ─── DB + SERVER ─────────────────────────────────────────────────────────────
async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const PORT = process.env.PORT || 3005;
    app.listen(PORT);
    console.log(`Server listening on port ${PORT}`);
}

main();