import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "../components/Button";
import API from "../api/axios";
import toast, { Toaster } from "react-hot-toast";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const role = location.state?.role || "user";

  // If someone lands here directly without email, send them to signup
  useEffect(() => {
    if (!location.state?.email) {
      navigate("/signup", { replace: true });
    }
  }, []);

  const verifyEndpoint =
    role === "admin" ? "/admin/verify-email" : "/user/verify-email";
  const resendEndpoint =
    role === "admin"
      ? "/admin/resend-verification-code"
      : "/user/resend-verification-code";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(e, index) {
    const value = e.target.value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    const next = Math.min(pasted.length, 5);
    inputRefs.current[next]?.focus();
  }

  const isComplete = otp.every((d) => d !== "");

  async function handleVerify(e) {
    e.preventDefault();
    if (!isComplete) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    try {
      setLoading(true);
      await API.post(verifyEndpoint, { email, code: otp.join("") });
      toast.success("Email verified! Please sign in.");
      // ✅ Correct: redirect to signin, not home — user has no token yet
      navigate("/signin", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
      // Clear OTP on failure so user can retry
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      await API.post(resendEndpoint, { email });
      toast.success("New code sent! Check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-blue-900 tracking-tight">
            SkillHub
          </Link>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-white rounded-2xl shadow-xl px-8 py-10 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="text-sm text-gray-500">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`w-12 h-14 rounded-xl text-center text-2xl font-mono font-semibold
                  border-2 outline-none transition-all duration-150
                  ${digit ? "border-blue-500 bg-blue-50 text-blue-900" : "border-gray-200 bg-white text-gray-900"}
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
              />
            ))}
          </div>

          <Button type="submit" disabled={!isComplete || loading}>
            {loading ? "Verifying…" : "Verify Email"}
          </Button>

          {/* Resend */}
          <p className="text-center text-sm text-gray-500">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </p>

          <p className="text-center text-xs text-gray-400">
            Wrong email?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Go back to signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default VerifyEmail;