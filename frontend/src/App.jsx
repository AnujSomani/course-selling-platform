import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CourseLearnPage from "./pages/CourseLearnPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LegalPage from "./pages/LegalPage";
import ProtectedRoute from "./components/ProtectedRoute";
import about from "./pages/About";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1e3a5f",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            iconTheme: { primary: "#4ade80", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#fff" },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
        <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
        <Route path="/refund-and-cancellation" element={<LegalPage type="refund" />} />
        <Route path ="/about" element = {<about/>}/>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/learn/:courseId"
          element={
            <ProtectedRoute role="user">
              <CourseLearnPage />
            </ProtectedRoute>
          }
        />
        <Route path="/my-courses" element={<Navigate to="/dashboard?section=purchases" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
