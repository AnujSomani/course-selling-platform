// frontend/src/hooks/useRazorpay.js
//
// Lazily loads the Razorpay checkout SDK from their CDN.
// Never install razorpay as an npm package in the frontend —
// it's a Node.js SDK and has no place in a browser bundle.

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    // Already loaded — resolve immediately
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });