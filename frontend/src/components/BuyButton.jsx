// frontend/src/components/BuyButton.jsx
//
// Full Razorpay checkout flow:
//   1. Load Razorpay SDK from CDN
//   2. POST /payment/create-order → get orderId from your backend
//   3. Open Razorpay modal
//   4. On success: poll /payment/verify/:courseId until webhook confirms
//   5. Redirect to course page
//
// The frontend handler() is only for UX — the webhook is the real source of truth.
// Never grant access based on handler() alone.

import { useState } from "react";
import { loadRazorpayScript } from "../hooks/useRazorpay";
import axiosInstance from "../lib/axiosInstance";

// Polls /payment/verify/:courseId until status is completed
// Razorpay webhooks usually fire within 1–3 seconds of payment
// We poll for up to 15 seconds before showing a fallback message
const pollForAccess = async (courseId, maxAttempts = 15) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000)); // wait 1s between each poll
    try {
      const { data } = await axiosInstance.get(`/payment/verify/${courseId}`);
      if (data.purchased) return true;
    } catch (_) {
      // network blip — keep polling
    }
  }
  return false; // webhook delayed beyond 15s
};

export default function BuyButton({ courseId, className = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Razorpay SDK failed to load. Check your internet connection.");
      }

      // Step 2: Create order on your backend
      const { data } = await axiosInstance.post("/payment/create-order", { courseId });

      // Step 3: Configure and open Razorpay checkout
      const options = {
        key: data.keyId,          // public key — safe in browser
        amount: data.amount,      // in paise
        currency: data.currency,
        name: "SkillHub",
        description: data.courseName,
        image: data.courseImage,
        order_id: data.orderId,

        // Called by Razorpay after successful payment
        // DO NOT use this as the sole access grant — webhook may not have fired yet
        handler: async function () {
          // Poll backend until webhook confirms the purchase in DB
          const confirmed = await pollForAccess(courseId);

          setLoading(false);

          if (confirmed) {
            window.location.href = `/courses/${courseId}`;
          } else {
            // Webhook is delayed (rare) — don't block the user, show soft message
            alert(
              "Payment successful! Your access is being activated. " +
              "Refresh the page in a minute if you don't see the course."
            );
            window.location.href = `/courses/${courseId}`;
          }
        },

        prefill: {
          // Optionally pull from your auth context/store
          // name: user.firstname + " " + user.lastname,
          // email: user.email,
        },

        theme: {
          color: "#6366f1", // matches SkillHub indigo primary
        },

        modal: {
          // Called when user closes the modal without paying
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        setError(
          response.error.description ||
          "Payment failed. Please try again or use a different payment method."
        );
        setLoading(false);
      });

      rzp.open();

    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Something went wrong.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={loading}
        className={`
          flex items-center justify-center gap-2
          bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
          disabled:opacity-60 disabled:cursor-not-allowed
          text-white font-semibold px-6 py-2.5 rounded-lg
          transition-colors duration-150 w-full
          ${className}
        `}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Processing...
          </>
        ) : (
          "Buy Course"
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}