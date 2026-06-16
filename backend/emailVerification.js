const crypto = require("crypto");
const nodemailer = require("nodemailer");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(email, code) {
  return crypto.createHash("sha256").update(email + code).digest("hex");
}

async function sendEmail(to, code, { subject, firstName } = {}) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  await getTransporter().sendMail({
    from: `"Upskilio" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || "Your Upskilio verification code",
    text: `${greeting}\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#0b1f3a;margin-bottom:8px;">Upskilio</h2>
        <p style="color:#475569;margin-bottom:24px;">${greeting}</p>
        <p style="color:#334155;margin-bottom:12px;">Your verification code is:</p>
        <div style="letter-spacing:8px;font-size:32px;font-weight:800;color:#1d4ed8;text-align:center;padding:16px;background:#eff6ff;border-radius:8px;margin-bottom:24px;">
          ${code}
        </div>
        <p style="color:#64748b;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function startEmailVerification({ model, email, firstName, subjectPrefix }) {
  const user = await model.findOne({ email });
  if (!user) return { status: 404, message: "User not found" };

  if (user.isEmailVerified) {
    return { status: 400, message: "Email is already verified" };
  }

  const code = generateCode();
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

  try {
    await sendEmail(email, code, {
      subject: `${subjectPrefix || "Verify your account"} — Your Code`,
      firstName,
    });
  } catch {
    return {
      status: 500,
      message: "Account created but the verification email could not be sent. Use the resend option to try again.",
    };
  }

  return { status: 200, message: "Code sent" };
}

async function verifyEmailCode({ model, email, code }) {
  const user = await model.findOne({ email });
  if (!user) return { status: 404, message: "User not found" };

  const ev = user.emailVerification;
  if (!ev || !ev.codeHash) {
    return { status: 400, message: "No verification pending. Request a new code." };
  }

  if (new Date() > ev.expiresAt) {
    return { status: 400, message: "Code expired. Please request a new one." };
  }

  if (hashCode(email, code) !== ev.codeHash) {
    return { status: 400, message: "Invalid code. Double-check and try again." };
  }

  await model.updateOne(
    { email },
    {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      $unset: { emailVerification: "" },
    }
  );

  return { status: 200, message: "Email verified" };
}

module.exports = { startEmailVerification, verifyEmailCode };
