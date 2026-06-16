import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Star,
  Users,
  Clock,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BuyButton from "../components/BuyButton";
import { useAuth } from "../context/AuthContext";

// DEPENDENCY: Fallback image sourced from Unsplash CDN. Replace with self-hosted S3/CloudFront URL for full independence.
const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop";

const levelColor = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

function CourseDetailPage() {
  const { courseId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [previewContent, setPreviewContent] = useState([]);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        // Fetch all courses (public endpoint), find this one by id
        const coursesRes = await API.get("/course/preview");
        const found = (coursesRes.data.courses || []).find(
          (c) => c._id === courseId
        );
        if (!found) {
          setError("Course not found.");
          setLoading(false);
          return;
        }
        if (!ignore) setCourse(found);

        // Fetch free preview content
        const previewRes = await API.get(`/course/${courseId}/content/preview`);
        if (!ignore) setPreviewContent(previewRes.data.contents || []);

        // Check if user purchased
        if (user && user.role === "user") {
          try {
            const purchaseRes = await API.get(
              `/payment/verify-purchase/${courseId}`
            );
            if (!ignore) setPurchased(purchaseRes.data.purchased);
          } catch {
            // not purchased or not logged in
          }
        }
      } catch (err) {
        if (!ignore)
          setError(err.response?.data?.message || "Failed to load course.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-14 animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-full w-1/2" />
          <div className="h-64 bg-gray-200 rounded-2xl w-full" />
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 rounded-full w-2/3" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 text-blue-900 font-semibold hover:underline"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const price = course?.price ?? 0;
  const isFree = price === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-900 font-semibold transition mb-6"
        >
          <ArrowLeft size={16} /> All Courses
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img
                src={course.imageUrl || fallbackImage}
                alt={course.title}
                className="w-full h-64 lg:h-80 object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  levelColor[course.level] || "bg-blue-100 text-blue-800"
                }`}
              >
                {course.level || "Beginner"}
              </span>
              {course.category && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                  {course.category}
                </span>
              )}
              {purchased && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Enrolled
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {course.title}
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Star className="text-yellow-500" size={16} fill="currentColor" />
                <span className="font-bold text-gray-800">
                  {typeof course.rating === "number"
                    ? course.rating.toFixed(1)
                    : "New"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={15} />
                <span>{(course.totalStudents || 0).toLocaleString()} students</span>
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this course</h2>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Preview Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-900" />
                Course Content
              </h2>

              {previewContent.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No preview lessons available yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {previewContent.map((item, idx) => (
                    <li
                      key={item._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {item.type}
                        </p>
                      </div>
                      <Eye size={14} className="text-blue-700 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}

              {/* Locked content note */}
              {!purchased && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                  <Lock size={14} />
                  Purchase this course to unlock all lessons.
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (sticky card) ── */}
          <aside className="h-fit sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-5">
              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-blue-900">
                  {isFree ? "Free" : `₹${price.toLocaleString()}`}
                </span>
                {course.originalPrice && course.originalPrice > price && (
                  <span className="text-lg text-gray-400 line-through mb-1">
                    ₹{course.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* CTA */}
              {purchased ? (
                <Link
                  to={`/dashboard/learn/${courseId}`}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                >
                  <CheckCircle2 size={18} />
                  Start Learning
                </Link>
              ) : user && user.role === "user" ? (
                isFree ? (
                  <EnrollFreeButton courseId={courseId} />
                ) : (
                  <BuyButton courseId={courseId} />
                )
              ) : !user ? (
                <Link
                  to={`/signin`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition"
                >
                  Sign in to Enroll
                </Link>
              ) : (
                // Admin viewing
                <p className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                  You are viewing this as an admin.
                </p>
              )}

              {/* Course highlights */}
              <ul className="space-y-2 border-t border-gray-100 pt-4">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={15} className="text-blue-900" />
                  Full lifetime access
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen size={15} className="text-blue-900" />
                  {previewContent.length} free preview lesson{previewContent.length !== 1 ? "s" : ""}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={15} className="text-blue-900" />
                  {(course.totalStudents || 0).toLocaleString()} enrolled
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Enroll Free Button ────────────────────────────────────────────────────────
function EnrollFreeButton({ courseId }) {
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const navigate = useNavigate();

  async function handleEnroll() {
    try {
      setLoading(true);
      await API.post("/course/purchase", { courseId });
      setEnrolled(true);
      navigate(`/dashboard/learn/${courseId}`);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === "Course already purchased") {
        setEnrolled(true);
        navigate(`/dashboard/learn/${courseId}`);
        return;
      }
      alert(msg || "Enrollment failed.");
    } finally {
      setLoading(false);
    }
  }

  if (enrolled) {
    return (
      <Link
        to={`/dashboard/learn/${courseId}`}
        className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-bold py-3 rounded-xl"
      >
        <CheckCircle2 size={18} /> Start Learning
      </Link>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
    >
      {loading ? "Enrolling..." : "Enroll for Free"}
    </button>
  );
}

export default CourseDetailPage;
