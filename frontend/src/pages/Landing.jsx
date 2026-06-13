import Navbar from "../components/Navbar";
import Hero from "../components/hero";
import FeaturedCourses from "../components/FeaturedCourses";
import CategorySection from "../components/CategorySection";
import Footer from "../components/Footer";

// About section — inline since it's only used here
function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-block bg-blue-800 text-blue-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              About SkillHub
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Built for Learners,<br />Run by Experts.
            </h2>
            <p className="mt-5 text-blue-200 text-lg leading-relaxed">
              SkillHub is a modern course marketplace connecting ambitious learners
              with industry-leading instructors. Our platform supports live video
              streaming, secure payments, and a seamless learning experience.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Expert-vetted course content",
                "Secure Razorpay payment integration",
                "HD video lessons via CloudFront CDN",
                "Dedicated admin dashboard for instructors",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-blue-100">
                  <span className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["50,000+", "Active Students"],
              ["500+", "Expert Courses"],
              ["100+", "Top Instructors"],
              ["4.8★", "Average Rating"],
            ].map(([stat, label]) => (
              <div key={label} className="bg-blue-800/50 rounded-2xl p-6 border border-blue-700">
                <p className="text-3xl font-extrabold">{stat}</p>
                <p className="text-blue-300 text-sm mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedCourses />
      <CategorySection />
      <AboutSection />
      <Footer />
    </>
  );
}

export default Landing;