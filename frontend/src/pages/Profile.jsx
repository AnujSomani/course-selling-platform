import { useEffect, useState } from "react";
import { Lock, Mail, Save, ShieldCheck, UserCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";
import API from "../api/axios";
import Footer from "../components/landing/Footer";
import Navbar from "../components/landing/Navbar";

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
}

function Profile() {
  const role = localStorage.getItem("role") || "user";
  const token = localStorage.getItem(role === "admin" ? "adminToken" : "userToken");
  const storedEmail = localStorage.getItem(role === "admin" ? "adminEmail" : "userEmail") || "";
  const [account, setAccount] = useState(null);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [saving, setSaving] = useState(false);

  const endpointBase = role === "admin" ? "/admin" : "/user";
  const email = account?.email || storedEmail || "SkillHub member";
  const fullName = `${account?.firstname || ""} ${account?.lastname || ""}`.trim();

  useEffect(() => {
    if (!token) return;

    async function fetchAccount() {
      try {
        const response = await API.get(`${endpointBase}/me`);
        const profile = response.data.admin || response.data.user;
        setAccount(profile);
        if (profile?.email) {
          localStorage.setItem(role === "admin" ? "adminEmail" : "userEmail", profile.email);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load profile.");
      }
    }

    fetchAccount();
  }, [endpointBase, role, token]);

  if (!token || isExpired(token)) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    return <Navigate to="/signin" replace />;
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      await API.put(`${endpointBase}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(initialPasswordForm);
      toast.success("Password updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-blue-950">My Profile</h1>
          <p className="mt-1 text-base text-gray-500">
            {fullName ? `${fullName}, manage your SkillHub access and security.` : "Manage your SkillHub access and security."}
          </p>
        </div>

        <h2 className="mb-3 text-xl font-bold text-gray-950">Personal Information</h2>
        <section className="rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-100 text-blue-950">
              <UserCircle size={56} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-950">{fullName || email}</h3>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-5">
              <Mail className="text-blue-900" size={24} />
              <p className="mt-3 text-sm font-semibold text-gray-500">Email</p>
              <p className="mt-1 break-words text-lg font-bold text-gray-950">{email}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-5">
              <ShieldCheck className="text-blue-900" size={24} />
              <p className="mt-3 text-sm font-semibold text-gray-500">Role</p>
              <p className="mt-1 text-lg font-bold capitalize text-gray-950">{role}</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <UserCircle className="mt-1 shrink-0 text-blue-900" size={24} />
              <p className="leading-7 text-blue-950">
                Your account is active and ready for launcing new exciting courses
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Change Password</h2>
              <p className="mt-1 text-gray-600">Update your password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current password"
              autoComplete="current-password"
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="New password"
              autoComplete="new-password"
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-start-3"
            >
              <Save size={18} />
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Profile;
