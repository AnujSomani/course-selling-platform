import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import HeroImg from "../assets/Hero.png";
import { CATEGORIES } from "../constants/categories";

function Hero() {
  function scrollToCategories() {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="landingPage"
      className="scroll-mt-16 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/40 overflow-hidden relative"
    >
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Join 50,000+ Active Learners
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Master Skills
              <br />
              <span className="text-blue-900">That Build Careers.</span>
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Learn practical skills from industry experts, build real-world
              projects, and achieve your dream career with confidence.
            </p>

            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
              >
                Explore Courses
              </Link>
              <button
                type="button"
                onClick={scrollToCategories}
                className="inline-flex items-center gap-2 border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 cursor-pointer"
              >
                Browse Categories
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 flex-wrap">
              {[
                ["50K+", "Students"],
                ["500+", "Courses"],
                ["100+", "Instructors"],
              ].map(([stat, label]) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="text-3xl font-extrabold text-blue-900">{stat}</p>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-shrink-0 w-[460px] xl:w-[520px] items-center justify-center">
            <div className="relative w-full">
              <div className="absolute -top-8 -right-8 w-48 h-48 bg-blue-200 rounded-full opacity-30 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-200 rounded-full opacity-40 blur-2xl" />
              <img
                src={HeroImg}
                alt="Student learning on SkillHub"
                className="relative w-full object-contain rounded-3xl drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* Category preview strip */}
        <div className="mt-16 lg:mt-20">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-blue-800 mb-6">
            Popular Categories
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/courses?category=${cat.id}`}
                className={`group flex flex-col items-center gap-2 ${cat.bg} rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl shadow-sm`}
                >
                  {cat.emoji}
                </div>
                <span className="text-xs font-bold text-gray-900 text-center leading-tight group-hover:text-blue-900 transition">
                  {cat.label.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToCategories}
        aria-label="Scroll to categories"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-blue-900/60 hover:text-blue-900 transition animate-bounce cursor-pointer"
      >
        <span className="text-xs font-semibold">Scroll</span>
        <ChevronDown size={22} />
      </button>
    </section>
  );
}

export default Hero;
