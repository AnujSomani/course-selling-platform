// frontend/src/components/VideoUploader.jsx
//
// Admin-only component for uploading course videos/PDFs.
//
// Upload flow:
//   1. Admin selects a video file
//   2. GET /upload/presigned-url → backend returns { presignedUrl, s3Key }
//   3. XHR PUT to presignedUrl (direct to S3, tracks upload progress)
//   4. onUploadComplete(s3Key) → parent saves s3Key to contentModel via API

import { useState, useRef } from "react";
import API from "../api/axios";

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE_GB = 4;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

const uploadToS3WithProgress = (presignedUrl, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) resolve();
      else reject(new Error(`S3 upload failed with status ${xhr.status}`));
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(file);
  });

export default function VideoUploader({ courseId, onUploadComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Only MP4, WebM, or MOV files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File too large. Maximum size is ${MAX_SIZE_GB}GB.`);
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setErrorMsg("");
    setProgress(0);

    try {
      const { data } = await API.get("/upload/presigned-url", {
        params: { fileType: file.type, courseId, fileName: file.name },
      });

      await uploadToS3WithProgress(data.presignedUrl, file, setProgress);

      setStatus("done");
      onUploadComplete(data.s3Key);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Upload failed. Please try again.");
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
    setFileName("");
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
        disabled={status === "uploading"}
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 border-2 border-dashed border-gray-300
                     hover:border-blue-500 rounded-lg px-4 py-3 text-sm
                     text-gray-600 hover:text-blue-700 transition-colors w-full justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Click to upload video (MP4 / WebM / MOV, max {MAX_SIZE_GB}GB)
        </button>
      )}

      {status === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span className="truncate max-w-xs">{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-900 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">Uploading directly to storage... do not close this tab.</p>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="truncate max-w-xs">{fileName} uploaded</span>
          </div>
          <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Replace
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{errorMsg}</p>
          <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 underline ml-2">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}