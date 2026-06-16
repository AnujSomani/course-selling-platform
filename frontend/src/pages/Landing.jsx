import Navbar from "../components/Navbar";
import Hero from "../components/hero";
import FeaturedCourses from "../components/FeaturedCourses";
import CategorySection from "../components/CategorySection";
import Footer from "../components/Footer";

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedCourses />
      <CategorySection />
      <Footer />
    </>
  );
}

export default Landing;
