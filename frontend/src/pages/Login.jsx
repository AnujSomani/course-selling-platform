import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { UserCircle2, Shield } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";

const ROLES = [
  { value: "user", label: "Learner", Icon: UserCircle2 },
  { value: "admin", label: "Instructor", Icon: Shield },
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(location.search);
  const [role, setRole] = useState(params.get("role") === "admin" ? "admin" : "user");
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
      login(res.data.token, role, formData.email, res.data.firstname, res.data.lastname);
      toast.success("Welcome back!");
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      if (err.response?.data?.requiresEmailVerification) {
        toast.error("Please verify your email first.");
        navigate("/verify-email", { state: { email: formData.email, role } });
        return;
      }
      toast.error(err.response?.data?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10">
        <Link to="/" className="inline-flex items-center font-extrabold text-xl mb-8 text-blue-900">
          Upskil<span className="text-blue-500">io</span>
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Sign In</h1>
        <p className="text-gray-500 mt-1 mb-6">
          Don&apos;t have an account?{" "}
          <Link to={`/signup?role=${role}`} className="text-blue-700 font-semibold hover:underline">
            Sign up
          </Link>
        </p>

        {/* Role toggle */}
        <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 mb-6">
          {ROLES.map(({ value, label, Icon: RoleIcon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                role === value
                  ? "bg-white text-blue-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <RoleIcon size={16} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSignin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Your password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
          <Button type="submit" variant="primary" disabled={loading} className="py-3.5 mt-2">
            {loading ? "Signing In…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
