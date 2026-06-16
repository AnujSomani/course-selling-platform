import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "../constants/categories";

function CategorySection() {
  return (
    <section
      id="categories"
      className="scroll-mt-16 bg-[#f8fafc]"
    >
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
            Explore Popular Categories
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Discover the perfect path for your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/courses?category=${cat.id}`}
              className="group flex items-center gap-5 bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}
              >
                {cat.emoji}
              </div>
              <div className="min-w-0 text-left">
                <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-900 transition">
                  {cat.label}
                </h3>
                <p className={`text-sm font-medium mt-1 ${cat.text}`}>{cat.count}</p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-gray-300 group-hover:text-blue-700 group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-blue-900 font-semibold hover:underline underline-offset-4 transition cursor-pointer"
          >
            See all courses <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
