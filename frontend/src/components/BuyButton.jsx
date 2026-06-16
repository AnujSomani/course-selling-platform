import { useState } from "react";
import { loadRazorpayScript } from "../hooks/useRazorpay";
import API from "../api/axios";

const pollForAccess = async (courseId, maxAttempts = 15) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const { data } = await API.get(`/payment/verify-purchase/${courseId}`);
      if (data.purchased) return true;
    } catch {
      // network hiccup — keep polling
    }
  }
  return false;
};

export default function BuyButton({ courseId, className = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async () => {
    setLoading(true);
    setError("");

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Razorpay SDK failed to load. Check your internet connection.");
      }

      const { data } = await API.post("/payment/create-order", { courseId });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Upskilio",
        description: data.courseName,
        image: data.courseImage,
        order_id: data.orderId,

        handler: async function (response) {
          try {
            await API.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (_err) {
            // verification will be confirmed via pollForAccess below
          }

          const confirmed = await pollForAccess(courseId);
          setLoading(false);

          if (confirmed) {
            window.location.href = `/dashboard/learn/${courseId}`;
          } else {
            alert(
              "Payment successful! Your access is being activated. " +
                "Refresh the page in a minute if you don't see the course."
            );
            window.location.href = `/dashboard?section=purchases`;
          }
        },

        theme: { color: "#1e3a5f" },
        modal: { ondismiss: () => setLoading(false) },
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
      const message = err.response?.data?.message || err.message || "Something went wrong.";
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
          bg-blue-900 hover:bg-blue-800 active:bg-blue-950
          disabled:opacity-60 disabled:cursor-not-allowed
          text-white font-semibold px-6 py-3 rounded-xl
          transition-all duration-150 w-full shadow-sm hover:shadow-md
          ${className}
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing...
          </>
        ) : (
          "Buy Course"
        )}
      </button>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
