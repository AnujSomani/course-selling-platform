const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");
require("dotenv").config();

app.use(express.json()); 
app.use("/api/v1/user",userRouter);
app.use("/api/v1/admin",adminRouter);
app.use("/api/v1/course",courseRouter);


async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const PORT = process.env.PORT || 3005;
    app.listen(PORT);
    console.log(`Listening on port ${PORT}`);
}
 
main();
 