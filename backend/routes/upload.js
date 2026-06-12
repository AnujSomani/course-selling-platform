// backend/routes/upload.js
//
// Mounts on: /api/v1/upload
//
// How video upload works (presigned URL pattern):
//   1. Admin requests a presigned URL from this endpoint
//   2. Backend generates a one-time S3 PutObject URL (expires in 15 min)
//   3. Frontend uploads the video DIRECTLY to S3 using that URL
//      (never passes through your Express server — no memory/bandwidth issues)
//   4. Frontend sends the returned S3 key to your content routes to save in DB
//
// Routes:
//   GET /presigned-url   → generate S3 presigned upload URL (admin only)

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");
const { adminMiddleware } = require("../middlewares/admin"); // Fix #3: was ../middlewares/auth

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_PDF_TYPES = ["application/pdf"]; // Fix #22: PDFs are also supported
const ALLOWED_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_PDF_TYPES];
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB
const PRESIGNED_URL_EXPIRY = 60 * 15; // 15 minutes — enough for large uploads

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/upload/presigned-url?fileType=video/mp4&courseId=xxx&fileName=lecture1
// Auth: admin JWT required
// ─────────────────────────────────────────────────────────────────────────────
router.get("/presigned-url", adminMiddleware, async (req, res) => {
  const { fileType, courseId, fileName } = req.query;

  // Validate inputs
  if (!fileType || !courseId) {
    return res.status(400).json({ message: "fileType and courseId are required" });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return res.status(400).json({
      message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
    });
  }

  try {
    // Build a unique, organized S3 key
    // courses/{courseId}/videos/{uuid}-{sanitizedFileName}.mp4
    const sanitizedName = (fileName || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    // Use subfolder based on content type: videos/ or pdfs/
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
      // ContentLength not set here — browser sets it on actual upload
    });

    // Generate one-time presigned URL valid for 15 minutes
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    res.json({
      presignedUrl, // frontend uses this to PUT the file directly to S3
      s3Key,        // frontend sends this back to save in contentModel.url
    });
  } catch (err) {
    console.error("[presigned-url] Error:", err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

module.exports = router;