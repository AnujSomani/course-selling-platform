import { useState } from "react";
import { Lock, Mail, Save, ShieldCheck, UserCircle, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function Profile() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const role = user.role;
  const email = user.email || "Upskilio member";
  const firstname = user.firstname || "";
  const lastname  = user.lastname  || "";
  const fullName  = [firstname, lastname].filter(Boolean).join(" ") || email;

  // Quick links depend on role
  const quickLinks =
    role === "admin"
      ? [
          { label: "My Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
        ]
      : [
          { label: "My Dashboard", to: "/dashboard", icon: LayoutDashboard },
          { label: "My Purchases", to: "/dashboard?section=purchases", icon: ShoppingBag },
        ];

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const endpoint = role === "admin" ? "/admin/change-password" : "/user/change-password";
      await API.put(endpoint, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated successfully.");
      setPasswordForm(initialPasswordForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account settings and security.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Identity card ── */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* coloured header strip */}
            <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {/* avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-900 ring-4 ring-blue-100">
                  <UserCircle size={44} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                    {role === "admin" ? "Instructor" : "Learner"}
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900 truncate">{fullName}</h2>
                  <p className="mt-0.5 text-sm text-slate-500 truncate">{email}</p>
                  <p className="mt-1 text-sm text-slate-400">Account active · Email verified</p>
                </div>
              </div>

              {/* info grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {firstname && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <User size={18} className="text-blue-700 shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Name</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                  </div>
                )}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail size={18} className="text-blue-700 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 break-all">{email}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck size={18} className="text-blue-700 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Role</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{role === "admin" ? "Instructor" : "Learner"}</p>
                </div>
              </div>

              {/* quick nav links */}
              <div className="mt-6 flex flex-wrap gap-3">
                {quickLinks.map(({ label, to, icon: LinkIcon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200"
                  >
                    <LinkIcon size={15} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ── Change password ── */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Change Password</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update your password to keep your account secure.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-3">
              {[
                { name: "currentPassword", placeholder: "Current password", autoComplete: "current-password" },
                { name: "newPassword", placeholder: "New password", autoComplete: "new-password" },
                { name: "confirmPassword", placeholder: "Confirm new password", autoComplete: "new-password" },
              ].map((field) => (
                <input
                  key={field.name}
                  type="password"
                  name={field.name}
                  value={passwordForm[field.name]}
                  onChange={handlePasswordChange}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:bg-white"
                />
              ))}
              <button
                type="submit"
                disabled={saving}
                className="sm:col-start-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;
