import { Link } from "react-router-dom";
import HeroImg from "../assets/Hero.png";

const HERO_STATS = [
  ["50K+", "Students"],
  ["500+", "Courses"],
  ["100+", "Instructors"],
];

function Hero() {
  function scrollToCategories() {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="landingPage"
      className="scroll-mt-16 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f0f7ff 60%, #f8fafc 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
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
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Courses
              </Link>
              <button
                type="button"
                onClick={scrollToCategories}
                className="inline-flex items-center gap-2 border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200"
              >
                Browse Categories
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 flex-wrap">
              {HERO_STATS.map(([stat, label]) => (
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
                alt="Student learning on Upskilio"
                className="relative w-full object-contain rounded-3xl drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
