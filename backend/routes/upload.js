const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");
const { adminMiddleware } = require("../middlewares/admin");

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const ALLOWED_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_PDF_TYPES];
const PRESIGNED_URL_EXPIRY = 60 * 15;

const REQUIRED_AWS_VARS = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET_NAME"];
const missingVars = REQUIRED_AWS_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(`[upload] Missing AWS env vars: ${missingVars.join(", ")}`);
}

router.get("/presigned-url", adminMiddleware, async (req, res) => {
  const { fileType, courseId, fileName } = req.query;

  if (!fileType || !courseId) {
    return res.status(400).json({ error: "fileType and courseId are required" });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return res.status(400).json({
      error: "Unsupported file type",
    });
  }

  try {
    const sanitizedName = (fileName || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
    const folder = isVideo ? "videos" : "pdfs";
    const extension = isVideo
      ? fileType.split("/")[1].replace("quicktime", "mov")
      : "pdf";
    const s3Key = `courses/${courseId}/${folder}/${uuidv4()}-${sanitizedName}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY });

    res.json({ presignedUrl, s3Key });
  } catch (err) {
    console.error("[presigned-url] Error:", err.message || err);
    const msg =
      err.message?.includes("credentials") || err.message?.includes("region")
        ? "AWS credentials or region not configured. Check your .env file."
        : err.message?.includes("NoSuchBucket") || err.message?.includes("bucket")
        ? "S3 bucket not found. Check AWS_S3_BUCKET_NAME in your .env file."
        : "Failed to generate upload URL";
    res.status(500).json({ message: msg });
  }
});

module.exports = router;
