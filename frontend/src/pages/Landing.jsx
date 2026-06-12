import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import CategorySection from "../components/landing/CategorySection";
import FeaturedCourses from "../components/landing/FeaturedCourses";

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <CategorySection />
      <FeaturedCourses />
    </>
  );
}

export default Landing;