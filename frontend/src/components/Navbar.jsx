import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, BookOpen, LayoutDashboard } from "lucide-react";
import toast from "react-hot-toast";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Signed out");
    navigate("/");
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 shadow-sm border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-blue-900 hover:text-blue-700 transition"
        >
          SkillHub
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          <Link to="/courses" className="text-gray-700 font-medium hover:text-blue-900 transition">
            Courses
          </Link>
          <a href="/#categories" className="text-gray-700 font-medium hover:text-blue-900 transition">
            Categories
          </a>
          {!user && (
            <Link to="/signup?role=admin" className="text-gray-700 font-medium hover:text-blue-900 transition">
              Become Instructor
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            // Logged in — show dashboard link + logout
            <>
              {user.role === "admin" ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-blue-900 font-medium hover:bg-blue-50 transition"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/my-courses"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-blue-900 font-medium hover:bg-blue-50 transition"
                >
                  <BookOpen size={16} />
                  My Courses
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            // Logged out
            <>
              <Link
                to="/signin"
                className="px-4 py-2 rounded-xl text-blue-900 font-medium hover:bg-blue-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-blue-900 hover:bg-blue-800 hover:shadow-md shadow-sm text-white px-5 py-2 rounded-xl font-medium transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;