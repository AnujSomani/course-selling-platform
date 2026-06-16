const express = require("express");
const router = express.Router();
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

const { userMiddleware } = require("../middlewares/user");
const { contentModel, purchaseModel } = require("../db");

const CF_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CF_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
const CF_PRIVATE_KEY = (process.env.CLOUDFRONT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const STREAM_URL_EXPIRY_SECONDS = 60 * 60 * 2;

router.get("/url/:contentId", userMiddleware, async (req, res) => {
  const { contentId } = req.params;
  const userId = req.userId;

  try {
    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (!content.isPreview) {
      const purchase = await purchaseModel.findOne({
        userId,
        courseId: content.courseId,
        status: "completed",
      });

      if (!purchase) {
        return res.status(403).json({ message: "Purchase required to access this content" });
      }
    }

    const resourceUrl = `https://${CF_DOMAIN}/${content.url}`;
    const expiresAt = Math.floor(Date.now() / 1000) + STREAM_URL_EXPIRY_SECONDS;

    const signedUrl = getSignedUrl({
      url: resourceUrl,
      keyPairId: CF_KEY_PAIR_ID,
      dateLessThan: new Date(expiresAt * 1000).toISOString(),
      privateKey: CF_PRIVATE_KEY,
    });

    res.json({ streamUrl: signedUrl });
  } catch (err) {
    console.error("[stream-url] Error:", err);
    res.status(500).json({ message: "Failed to generate stream URL" });
  }
});

module.exports = router;
