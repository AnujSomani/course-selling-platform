import { ArrowRight, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";

function CourseCard({ course }) {
  if (!course) return null;

  const title = course.title || "Untitled Course";
  const category = course.category || "General";
  const level = course.level || "Beginner";
  const rating = typeof course.rating === "number" ? course.rating.toFixed(1) : "New";
  const students = course.totalStudents || 0;
  const price = course.price ?? 0;
  const originalPrice = course.originalPrice || null;
  const imageUrl =
    course.imageUrl ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop";

  const levelColor = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  }[level] || "bg-blue-100 text-blue-800";

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
        transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md block"
    >
      {/* Course Image */}
      <div className="overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop";
          }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category + Level */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{category}</p>
          <span className={`${levelColor} px-2.5 py-1 rounded-full text-xs font-semibold`}>
            {level}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-900 transition-colors duration-200">
          {title}
        </h3>

        {/* Rating + Students */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-bold text-gray-900">{rating}</span>
          </div>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-1 text-gray-400">
            <Users size={13} />
            <span className="text-xs">{students.toLocaleString()} students</span>
          </div>
        </div>

        {/* Price + Enroll */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-900">₹{price.toLocaleString()}</span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-blue-900 font-semibold text-sm group-hover:gap-2 transition-all duration-200">
            <span>Enroll</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;