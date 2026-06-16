import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Button from "../components/Button";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || "";
  const role  = location.state?.role  || "user";

  // Guard: if someone lands here without going through signup, redirect them
  useEffect(() => {
    if (!location.state?.email) navigate("/signup", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyEndpoint = role === "admin"
    ? "/admin/verify-email"
    : "/user/verify-email";

  const resendEndpoint = role === "admin"
    ? "/admin/resend-verification-code"
    : "/user/resend-verification-code";

  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function setDigit(index, digit) {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  }

  function handleChange(e, index) {
    const value = e.target.value.replace(/\D/g, "").slice(-1);
    setDigit(index, value);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(e, index) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setDigit(index - 1, "");
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    setOtp((prev) => {
      const next = [...prev];
      pasted.split("").forEach((d, i) => (next[i] = d));
      return next;
    });
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
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
      const res = await API.post(verifyEndpoint, { email, code: otp.join("") });

      // Backend returns a JWT on successful verification — log in immediately
      const { token, firstname, lastname } = res.data;
      login(token, role, email, firstname, lastname);

      toast.success("Email verified! Welcome to Upskilio.");
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
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
    <div className="min-h-screen flex justify-center items-center bg-slate-100 px-4">

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Upskil<span className="text-blue-500">io</span>
          </Link>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="text-sm text-gray-500">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={loading}
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`w-12 h-14 rounded-xl text-center text-2xl font-mono font-semibold
                  border-2 outline-none transition-all duration-150 disabled:opacity-60
                  ${digit
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-gray-900"
                  }
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
              />
            ))}
          </div>

          <Button type="submit" disabled={!isComplete || loading}>
            {loading ? "Verifying…" : "Verify Email"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Didn&apos;t receive it?{" "}
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
