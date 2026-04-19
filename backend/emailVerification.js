const crypto = require("crypto");
const nodemailer = require("nodemailer");

// transporter (FREE: use Gmail / Mailtrap)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


function hashCode(email, code) {
  return crypto
    .createHash("sha256")
    .update(email + code)
    .digest("hex");
}


async function sendEmail(to, code) {
  // DEV MODE → just print
  if (process.env.EMAIL_DEV_MODE === "1") {
    console.log("CODE:", code);
    return;
  }

  // REAL EMAIL
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Email Verification",
    text: `Your verification code is ${code}`
  });
}

async function startEmailVerification({ model, email }) {
  const user = await model.findOne({ email });
  if (!user) return { status: 404, message: "User not found" };

  const code = generateCode();
  const codeHash = hashCode(email, code);

  await model.updateOne(
    { email },
    {
      emailVerification: {
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
      }
    }
  );

  await sendEmail(email, code);

  return { status: 200, message: "Code sent" };
}


async function verifyEmailCode({ model, email, code }) {
  const user = await model.findOne({ email });
  if (!user) return { status: 404, message: "User not found" };

  const ev = user.emailVerification;
  if (!ev) return { status: 400, message: "No verification found" };

  if (ev.expiresAt < new Date()) {
    return { status: 400, message: "Code expired" };
  }

  const hashed = hashCode(email, code);

  if (hashed !== ev.codeHash) {
    return { status: 400, message: "Invalid code" };
  }

  await model.updateOne(
    { email },
    {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      $unset: { emailVerification: "" }
    }
  );

  return { status: 200, message: "Email verified" };
}

module.exports = {
  startEmailVerification,
  verifyEmailCode
};