import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, UserCircle2, Shield } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const params = new URLSearchParams(location.search);
  const [role, setRole] = useState(params.get("role") === "admin" ? "admin" : "user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSignin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = role === "admin" ? "/admin/signin" : "/user/signin";
      const res = await API.post(endpoint, formData);
      login(res.data.token, role, formData.email);
      toast.success("Welcome back!");
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Sign in failed";
      if (err.response?.data?.requiresEmailVerification) {
        toast.error("Please verify your email first.");
        navigate("/verify-email", { state: { email: formData.email, role } });
        return;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Toaster position="top-right" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 bg-blue-900 flex-col justify-center items-center px-16 text-white">
        <div className="max-w-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            {role === "admin"
              ? <Shield size={40} className="text-blue-200" />
              : <UserCircle2 size={40} className="text-blue-200" />
            }
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Welcome Back
          </h2>
          <p className="mt-4 text-blue-200 text-base leading-relaxed">
            {role === "admin"
              ? "Manage your courses, track student progress and grow your teaching career."
              : "Pick up right where you left off. Your courses are waiting for you."}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[["50K+", "Students"], ["500+", "Courses"], ["100+", "Instructors"]].map(([num, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <p className="text-xl font-bold">{num}</p>
                <p className="text-xs text-blue-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <Link to="/" className="inline-flex items-center text-blue-900 font-bold text-xl mb-8">
            Skill<span className="text-blue-500">Hub</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900">Sign In</h1>
          <p className="text-gray-500 mt-1 mb-6">
            Don&apos;t have an account?{" "}
            <Link to={`/signup?role=${role}`} className="text-blue-700 font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Role Toggle */}
          <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                role === "user"
                  ? "bg-white text-blue-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserCircle2 size={16} /> Learner
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                role === "admin"
                  ? "bg-white text-blue-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Shield size={16} /> Instructor
            </button>
          </div>

          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900
                  outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-gray-900
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-bold py-3.5 rounded-xl transition-all duration-200
                shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
