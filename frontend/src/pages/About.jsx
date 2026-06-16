import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Video, Star } from "lucide-react";

const STATS = [
  { value: "50,000+", label: "Active Students",  icon: Users    },
  { value: "500+",    label: "Expert Courses",    icon: BookOpen },
  { value: "100+",    label: "Top Instructors",   icon: Star     },
  { value: "HD",      label: "Video Streaming",   icon: Video    },
];

const FEATURES = [
  { title: "Expert-vetted content",       desc: "Every course is reviewed for quality and accuracy before it goes live." },
  { title: "Secure payments",             desc: "Powered by Razorpay — fast, reliable checkout with zero exposure of your card details." },
  { title: "HD video via CloudFront CDN", desc: "Lessons stream in high definition from edge servers closest to you." },
  { title: "Admin creator dashboard",     desc: "Instructors get a full-featured studio to build, manage, and publish courses." },
];

function About() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── solid dark, no gradient fade to white ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* bottom glow that blends into the section edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-block mb-5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
            About Upskilio
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Built for Learners.
            <br />
            <span className="text-blue-400">Run by Experts.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-slate-300 leading-relaxed">
            Upskilio connects ambitious learners with industry-leading instructors
            through a platform built for real learning — live video, secure payments,
            and a seamless experience on any device.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white px-7 py-3.5 font-bold text-sm transition shadow-lg shadow-blue-500/30"
            >
              Browse Courses <ArrowRight size={15} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 font-bold text-sm transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── white bg, no borders, clean separation via shadow ── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon }) => {
              const StatIcon = icon;
              return (
                <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 mb-3">
                    <StatIcon size={20} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                  <p className="mt-1 text-sm text-slate-500 font-medium">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mission ── same white bg, just more padding ── */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 pb-20 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Our Mission</h2>
          <p className="mt-5 text-lg text-slate-500 leading-relaxed">
            We believe quality education should be accessible to everyone. Upskilio
            empowers learners to grow at their own pace while giving instructors a
            powerful platform to share their expertise with the world.
          </p>
        </div>
      </section>

      {/* ── Features grid ── very subtle bg, no visible border ── */}
      <section className="bg-slate-50/70">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-12">
            Why Upskilio?
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl bg-white border border-slate-100 p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mb-4" />
                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
