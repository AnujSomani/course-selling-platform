import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ReceiptText } from "lucide-react";
import API from "../api/axios";
import Footer from "../components/landing/Footer";
import Navbar from "../components/landing/Navbar";

const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadPurchases() {
      try {
        const response = await API.get("/user/purchases");
        if (!ignore) setPurchases(response.data.purchases || []);
      } catch {
        if (!ignore) setPurchases([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPurchases();
    return () => {
      ignore = true;
    };
  }, []);

  const purchasedCourses = purchases.map((purchase) => purchase.courseId).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-900">Your Library</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Purchased Courses</h1>
          <p className="mt-2 text-gray-600">
            Only courses you have paid for appear here. Open a course to access its full content.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : purchasedCourses.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-900">
              <ReceiptText size={36} />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-950">No purchases yet</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
              Browse the catalog, complete checkout, and your purchased courses will show up here.
            </p>
            <Link
              to="/courses"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Browse Courses
              <ArrowRight size={18} />
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchasedCourses.map((course) => (
              <article
                key={course._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <img
                  src={course.imageUrl || fallbackImage}
                  alt={course.title}
                  className="h-44 w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-xs font-bold text-blue-900">
                    {course.category || "General"} · {course.level || "Beginner"}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{course.title}</h3>
                  <Link
                    to={`/courses/${course._id}`}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    <BookOpen size={16} />
                    Open Course
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Purchases;
