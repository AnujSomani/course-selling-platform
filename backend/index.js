require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");

const uploadRouter = require("./routes/upload");
const streamRouter = require("./routes/stream");

const paymentRouter = require("./routes/payment");
const { paymentWebhookHandler } = require("./routes/payment");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));

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

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const PORT = process.env.PORT || 3005;
    app.listen(PORT);
    console.log(`Server listening on port ${PORT}`);
}

main();