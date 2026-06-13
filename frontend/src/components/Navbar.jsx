import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getInitials } from "./DashboardLayout";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Categories", to: "/#categories" },
  { label: "About", to: "/about" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    logout();
    toast.success("Signed out");
    navigate("/");
    setMobileOpen(false);
    setProfileOpen(false);
  }

  function isActiveLink(to) {
    if (to === "/") return location.pathname === "/";
    if (to.startsWith("/#")) return location.pathname === "/" && location.hash === to.slice(1);
    return location.pathname.startsWith(to);
  }

  const initials = getInitials(user?.email);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-900 flex-shrink-0 hover:opacity-90 transition"
        >
          Skill<span className="text-blue-500">Hub</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActiveLink(link.to)
                  ? "text-blue-900 bg-blue-50"
                  : "text-gray-600 hover:text-blue-900 hover:bg-blue-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white transition hover:bg-blue-800 ring-4 ring-blue-50 hover:ring-blue-100 cursor-pointer"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                {initials.charAt(0)}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-xl z-50">
                  {user.role === "admin" ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="block px-5 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-5 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block px-5 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                      >
                        Purchases
                      </Link>
                    </>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-5 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                    >
                      My Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/signin"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 transition cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-900 text-white hover:bg-blue-800 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-900 hover:bg-blue-50"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-900 hover:bg-blue-50"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-900 hover:bg-blue-50"
                    >
                      Purchases
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-900 border border-blue-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-900 text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
