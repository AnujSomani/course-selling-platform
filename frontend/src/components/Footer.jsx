import { FaInstagram,FaLinkedin,FaTwitter } from "react-icons/fa"
import { Link } from "react-router-dom";

const socialLinks = [
  { label: "Twitter", href: "https://x.com/AnujSomani05", icon: FaTwitter },
  { label: "Instagram", href: "https://www.instagram.com/anuj_somani05/", icon: FaInstagram},
  { label: "LinkedIn", href: "https://www.linkedin.com/in/anuj-somani05/", icon: FaLinkedin },
];

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1rem] select-none text-center text-[24vw]
                       font-black leading-none tracking-normal text-white/10">
        Upskilio
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),
                     linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <Link to="/" className="text-3xl font-bold text-white">
            Upskilio
          </Link>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Practical courses, project-led learning, and career-focused guidance for students and instructors.
          </p>
          <div className="mt-8 grid gap-4 text-lg font-medium text-slate-200">
            <Link to="/terms-and-conditions" className="transition hover:text-white">
              Terms & Conditions
            </Link>
            <Link to="/privacy-policy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/refund-and-cancellation" className="transition hover:text-white">
              Refund & Cancellation
            </Link>
          </div>
        </div>

        <div className="md:text-right">
          <div className="flex flex-wrap gap-4 md:justify-end">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 
                             text-white transition hover:-translate-y-1 hover:bg-white/20"
                >
                  <Icon size={32} />
                </a>
              );
            })}
          </div>
          <p className="mt-8 text-lg text-slate-300">
            © 2026 Upskilio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

