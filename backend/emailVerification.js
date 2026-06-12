const crypto = require("crypto");
const nodemailer = require("nodemailer");

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


// Fix #19: accept subject and name so the email is personalised
async function sendEmail(to, code, { subject, firstName } = {}) {
  if (process.env.EMAIL_DEV_MODE === "1") {
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject} | CODE: ${code}`);
    return;
  }

  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: subject || "Email Verification",
    text: `${greeting}\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `<p>${greeting}</p><p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}

// Fix #19: now uses firstName and subjectPrefix params
// Fix #20: blocks resend if the user is already verified
async function startEmailVerification({ model, email, firstName, subjectPrefix }) {
  const user = await model.findOne({ email });
  if (!user) return { status: 404, message: "User not found" };

  // Fix #20: don't send a code to an account that's already verified
  if (user.isEmailVerified) {
    return { status: 400, message: "Email is already verified" };
  }

  const code     = generateCode();
  const codeHash = hashCode(email, code);

  await model.updateOne(
    { email },
    {
      emailVerification: {
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    }
  );

  // Fix #19: pass subject and name through to the email function
  await sendEmail(email, code, {
    subject:   `${subjectPrefix || "Verify your account"} — Your Code`,
    firstName,
  });

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