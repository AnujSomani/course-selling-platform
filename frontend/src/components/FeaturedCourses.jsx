import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import API from "../api/axios";
import CourseCard from "./CourseCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded-full w-24" />
          <div className="h-3 bg-gray-200 rounded-full w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-4 bg-gray-200 rounded-full w-1/2" />
        <div className="h-3 bg-gray-200 rounded-full w-1/3" />
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-5 bg-gray-200 rounded-full w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCourses() {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/course/preview");
      setCourses(response.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Featured Courses
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Learn From Our Best Courses
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Explore the most popular instructor-created courses.
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden sm:flex items-center gap-1 text-blue-900 font-semibold hover:text-blue-700 hover:underline underline-offset-4 transition-all duration-200"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
            <AlertCircle size={40} />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={fetchCourses}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <BookOpen size={40} />
            <p className="text-lg font-medium">No courses available yet.</p>
            <p className="text-sm">Check back soon — new courses are being added.</p>
          </div>
        )}

        {/* Courses grid */}
        {!loading && !error && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 6).map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
              >
                Browse All Courses <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default FeaturedCourses;