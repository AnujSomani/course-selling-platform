import Footer from "../components/landing/Footer";
import Navbar from "../components/landing/Navbar";

const legalContent = {
  terms: {
    title: "Terms & Conditions",
    updated: "Last updated: June 10, 2026",
    intro: "These terms explain how learners, instructors, and visitors may use SkillHub. By creating an account or using the platform, you agree to follow these terms.",
    sections: [
      ["Accounts", "You are responsible for keeping your login details secure and for activity that happens through your account."],
      ["Courses and access", "Course access is provided for personal learning. Sharing paid course material, credentials, or downloaded content without permission is not allowed."],
      ["Instructor content", "Instructors must publish original, lawful, and accurate course material. SkillHub may review or remove content that harms learners or violates platform rules."],
      ["Platform availability", "We work to keep SkillHub reliable, but maintenance, updates, or technical issues may temporarily affect access."],
      ["Acceptable use", "Do not misuse the service, attempt unauthorized access, disrupt other users, or upload harmful content."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: June 10, 2026",
    intro: "This policy describes the information SkillHub collects and how it is used to provide learning features, support accounts, and improve the service.",
    sections: [
      ["Information we collect", "We may collect account details such as name, email address, role, course activity, purchase records, and basic device or usage information."],
      ["How we use data", "We use information to authenticate users, provide course access, process purchases, send important notices, improve product quality, and protect the platform."],
      ["Cookies and storage", "SkillHub may use cookies or browser storage for login sessions, preferences, analytics, and essential security features."],
      ["Data sharing", "We do not sell personal data. Limited information may be shared with service providers when needed for hosting, payments, support, analytics, or legal compliance."],
      ["Your choices", "You may request account updates or deletion where applicable. Some records may be retained when required for security, legal, or transaction purposes."],
    ],
  },
  refund: {
    title: "Refund & Cancellation",
    updated: "Last updated: June 10, 2026",
    intro: "This policy explains how refunds and cancellations work for SkillHub purchases.",
    sections: [
      ["Cancellation", "A learner may cancel a purchase request before payment is completed. Once access is granted, cancellation depends on the refund rules below."],
      ["Refund window", "Refund requests can be reviewed when raised within 7 days of purchase and when a substantial portion of the course has not been consumed."],
      ["Non-refundable cases", "Refunds may be declined for completed courses, misuse of access, shared credentials, downloaded materials, promotional free access, or policy abuse."],
      ["Processing", "Approved refunds are returned to the original payment method when possible. Bank or payment-provider timelines may vary."],
      ["How to request help", "Contact SkillHub support with your account email, course name, purchase date, and the reason for the request."],
    ],
  },
};

function LegalPage({ type }) {
  const content = legalContent[type] || legalContent.terms;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">{content.updated}</p>
          <h1 className="mt-3 text-4xl font-bold text-gray-950">{content.title}</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">{content.intro}</p>

          <div className="mt-10 space-y-8">
            {content.sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="text-xl font-bold text-gray-950">{title}</h2>
                <p className="mt-2 leading-7 text-gray-600">{text}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LegalPage;
