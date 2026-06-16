import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/axios";
import Input from "../components/Input";
import Button from "../components/Button";

const ROLES = [
  { value: "user", label: "Learner", Icon: UserCircle2 },
  { value: "admin", label: "Instructor", Icon: Shield },
];

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const [role, setRole] = useState(
    params.get("role") === "admin" ? "admin" : "user"
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSignup(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = role === "admin" ? "/admin/signup" : "/user/signup";
      await API.post(endpoint, formData);
      navigate("/verify-email", { state: { email: formData.email, role } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10">
        <Link
          to="/"
          className="inline-flex items-center font-extrabold text-xl mb-8 text-blue-900"
        >
          Upskil<span className="text-blue-500">io</span>
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Create Account</h1>
        <p className="text-gray-500 mt-1 mb-6">
          Already have one?{" "}
          <Link
            to={`/signin?role=${role}`}
            className="text-blue-700 font-semibold hover:underline"
          >
            Sign in
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              name="firstname"
              placeholder="Anuj"
              value={formData.firstname}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
            <Input
              label="Last Name"
              name="lastname"
              placeholder="Somani"
              value={formData.lastname}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
          </div>

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
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="py-3.5 mt-2"
          >
            {loading ? "Creating Account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          By signing up you agree to our{" "}
          <Link
            to="/terms-and-conditions"
            className="underline hover:text-gray-600"
          >
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link
            to="/privacy-policy"
            className="underline hover:text-gray-600"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default Signup;
