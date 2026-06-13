import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BookOpen, AlertCircle, RefreshCw, X, ChevronRight } from "lucide-react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";
import { CATEGORIES, getCategoryLabel, matchCategory } from "../constants/categories";

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      </div>
    </div>
  );
}

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");

  async function fetchCourses() {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/course/preview");
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load courses. Make sure the backend server is running on port 3005."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchSearch =
        !term ||
        c.title?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term);
      const matchLevel = selectedLevel === "All" || c.level === selectedLevel;
      const matchCat = matchCategory(c.category, categoryParam);
      return matchSearch && matchLevel && matchCat;
    });
  }, [courses, search, selectedLevel, categoryParam]);

  function setCategory(id) {
    if (id === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", id);
    }
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-800 uppercase mb-1">
              Course Catalog
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900">Explore All Courses</h1>
            {categoryParam !== "all" && (
              <p className="mt-1 text-sm text-gray-500">
                Showing: <span className="font-semibold text-blue-900">{getCategoryLabel(categoryParam)}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-72 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <Search className="shrink-0 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-700 transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">Courses</span>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setCategory("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
              categoryParam === "all"
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-900"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                categoryParam === cat.id
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                selectedLevel === level
                  ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-900"
              }`}
            >
              {level}
            </button>
          ))}
          {!loading && (
            <span className="ml-auto text-sm text-gray-400">
              {filtered.length} course{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-red-500">
            <AlertCircle size={44} />
            <p className="text-base font-semibold text-center max-w-sm">{error}</p>
            <button
              onClick={fetchCourses}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 font-medium transition cursor-pointer"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-gray-400">
            <BookOpen size={44} />
            <p className="text-base font-semibold">No courses match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedLevel("All");
                setCategory("all");
              }}
              className="text-sm text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CoursesPage;
