import { Link } from "react-router-dom";
import HeroImg from "../../assets/Hero.png";

function Hero() {
    return (
        <section id="landingPage" className="scroll-mt-24 bg-gradient-to-br from-white via-gray-50 to-blue-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-20">

                <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

                    {/* Left Side */}
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            Join 50,000+ Learners
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Master Skills
                            <br />
                            <span className="text-blue-900">That Build Careers.</span>
                        </h1>

                        <p className="mt-6 max-w-xl text-xl text-gray-600 leading-relaxed">
                            Learn practical skills from industry experts, build real-world
                            projects, and achieve your dream career with confidence.
                        </p>

                        <div className="mt-12 flex justify-center gap-4 flex-wrap lg:justify-start">
                            <Link
                                to="/courses"
                                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-4 rounded-xl
                                 font-semibold transition-all duration-200 shadow-sm hover:shadow-lg"
                            >
                                Explore Courses
                            </Link>
                            <Link
                                to="/signup?role=admin"
                               className="border border-blue-900 text-blue-900 hover:bg-blue-100 px-6 py-4 
                               rounded-xl font-semibold transition-all duration-200 hover:shadow-md"
                            >
                                Become Instructor
                            </Link>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-10 flex-wrap lg:justify-start">

                            <div>
                                <h2 className="text-3xl font-bold text-blue-900 ">
                                    50K+
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    Students
                                </p>
                            </div>

                               <div className="w-px h-10 bg-gray-200 hidden sm:block" />

                            <div>
                                <h2 className="text-3xl font-bold text-blue-900">
                                    500+
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    Courses
                                </p>
                            </div>

                               <div className="w-px h-10 bg-gray-200 hidden sm:block" />

                            <div>
                                <h2 className="text-3xl font-bold text-blue-900">
                                    100+
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    Instructors
                                </p>
                            </div>

                        </div>
                    </div>


                    <div className="hidden lg:flex flex-shrink-0 w-[540px]">

                        <img
                            src={HeroImg}
                            alt="Student learning on SkillHub"
                            className=" w-full h-full object-contain rounded-3xl 
                            transition-transform duration-500 hover:scale-[1.02]"
                        />
                    </div>

                </div>
            </div>
        </section>
    );
}

export default Hero;

