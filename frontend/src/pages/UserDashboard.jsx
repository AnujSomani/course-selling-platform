import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Compass,
  FileText,
  LayoutDashboard,
  PlayCircle,
  ReceiptText,
  UserCircle,
  Video,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format";

const contentIcon = {
  video: Video,
  pdf: FileText,
  link: FileText,
  text: FileText,
};

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [courseContents, setCourseContents] = useState({});
  const [loadingContent, setLoadingContent] = useState({});

  const section = searchParams.get("section") || "overview";
  const selectedCourseId = searchParams.get("course") || "";

  const purchasedCourses = useMemo(
    () =>
      purchases
        .filter((p) => p.status === "completed")
        .map((p) => p.courseId)
        .filter(Boolean),
    [purchases]
  );

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await API.get("/user/purchases");
        if (!ignore) setPurchases(res.data.purchases || []);
      } catch (err) {
        if (!ignore) toast.error(err.response?.data?.message || "Failed to load purchases.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (section === "purchases") {
      setExpandedCourses((s) => ({ ...s, __purchases: true }));
      if (selectedCourseId) loadCourseContent(selectedCourseId);
    }
  }, [section, selectedCourseId]);

  async function loadCourseContent(courseId) {
    if (courseContents[courseId] || loadingContent[courseId]) return;
    setLoadingContent((s) => ({ ...s, [courseId]: true }));
    try {
      const res = await API.get(`/user/courses/${courseId}/content`);
      setCourseContents((s) => ({ ...s, [courseId]: res.data.contents || [] }));
    } catch {
      toast.error("Could not load course content.");
    } finally {
      setLoadingContent((s) => ({ ...s, [courseId]: false }));
    }
  }

  function toggleCourseExpand(courseId) {
    const next = !expandedCourses[courseId];
    setExpandedCourses((s) => ({ ...s, [courseId]: next }));
    if (next) loadCourseContent(courseId);
  }

  function goTo(sectionName, courseId = "") {
    const params = new URLSearchParams();
    params.set("section", sectionName);
    if (courseId) params.set("course", courseId);
    navigate(`/dashboard?${params.toString()}`);
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    toast.success("Signed out");
    navigate("/");
  }

  const navGroups = [
    {
      title: "Overview",
      items: [
        {
          id: "overview",
          label: "Dashboard",
          icon: LayoutDashboard,
          active: section === "overview",
          onClick: () => goTo("overview"),
        },
      ],
    },
    {
      title: "My Learning",
      items: [
        {
          id: "purchases",
          label: "Purchases",
          icon: ReceiptText,
          active: section === "purchases" && !selectedCourseId,
          expanded: expandedCourses.__purchases ?? section === "purchases",
          onToggle: () => {
            setExpandedCourses((s) => ({
              ...s,
              __purchases: !s.__purchases,
            }));
            goTo("purchases");
          },
          children: purchasedCourses.map((course) => ({
            id: course._id,
            label: course.title || "Untitled",
            icon: BookOpen,
            active: selectedCourseId === course._id,
            expanded: expandedCourses[course._id],
            onToggle: () => {
              toggleCourseExpand(course._id);
              goTo("purchases", course._id);
            },
            children: (courseContents[course._id] || []).map((item) => {
              const Icon = contentIcon[item.type] || FileText;
              return {
                id: item._id,
                label: item.title,
                icon: Icon,
                onClick: () =>
                  navigate(`/dashboard/learn/${course._id}?lesson=${item._id}`),
              };
            }),
          })),
        },
        {
          id: "browse",
          label: "Browse Courses",
          icon: Compass,
          href: "/courses",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          id: "profile",
          label: "My Profile",
          icon: UserCircle,
          href: "/profile",
        },
      ],
    },
  ];

  const sectionTitles = {
    overview: "My Dashboard",
    purchases: selectedCourseId
      ? purchasedCourses.find((c) => c._id === selectedCourseId)?.title || "Purchased Course"
      : "My Purchases",
  };

  return (
    <DashboardLayout
      title={sectionTitles[section] || "My Dashboard"}
      email={user?.email}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      onLogout={handleLogout}
      navGroups={navGroups}
    >
      {section === "overview" && (
        <OverviewPanel
          courses={purchasedCourses}
          loading={loading}
          onBrowse={() => navigate("/courses")}
          onOpenCourse={(id) => navigate(`/dashboard/learn/${id}`)}
        />
      )}

      {section === "purchases" && (
        <PurchasesPanel
          courses={purchasedCourses}
          selectedCourseId={selectedCourseId}
          contents={courseContents}
          loading={loading}
          loadingContent={loadingContent}
          onSelectCourse={(id) => {
            loadCourseContent(id);
            goTo("purchases", id);
          }}
          onOpenLesson={(courseId, lessonId) =>
            navigate(`/dashboard/learn/${courseId}?lesson=${lessonId}`)
          }
        />
      )}
    </DashboardLayout>
  );
}

function OverviewPanel({ courses, loading, onBrowse, onOpenCourse }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0b1f3a] to-blue-900 px-6 py-8 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Welcome back</p>
        <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Continue your learning journey</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-200">
          Access your purchased courses, watch lessons, and track your progress — all in one place.
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-950 transition hover:bg-blue-50 cursor-pointer"
        >
          <Compass size={16} /> Browse Courses
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Purchased Courses" value={loading ? "—" : courses.length} icon={BookOpen} />
        <StatCard label="In Progress" value={loading ? "—" : courses.length} icon={BarChart3} />
        <StatCard label="Certificates" value="—" icon={ReceiptText} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">Recent Purchases</h3>
        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-6 text-center py-10">
            <ReceiptText className="mx-auto text-slate-300" size={40} />
            <p className="mt-3 font-semibold text-slate-600">No purchases yet</p>
            <button
              type="button"
              onClick={onBrowse}
              className="mt-4 text-sm font-bold text-blue-900 hover:underline cursor-pointer"
            >
              Explore the catalog →
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.slice(0, 4).map((course) => (
              <article
                key={course._id}
                className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:shadow-sm"
              >
                <img
                  src={course.imageUrl || fallbackImage}
                  alt={course.title}
                  className="h-20 w-28 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-bold text-slate-900">{course.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">{course.category || "General"}</p>
                  <button
                    type="button"
                    onClick={() => onOpenCourse(course._id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                  >
                    <PlayCircle size={13} /> Start learning
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PurchasesPanel({
  courses,
  selectedCourseId,
  contents,
  loading,
  loadingContent,
  onSelectCourse,
  onOpenLesson,
}) {
  const selected = courses.find((c) => c._id === selectedCourseId);
  const lessons = contents[selectedCourseId] || [];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <ReceiptText className="mx-auto text-slate-300" size={48} />
        <h3 className="mt-4 text-xl font-bold text-slate-900">No purchases yet</h3>
        <p className="mt-2 text-slate-500">Browse courses and complete checkout to see them here.</p>
        <Link
          to="/courses"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Browse Courses <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit">
        <h3 className="font-bold text-slate-900 px-2 mb-3">Your Courses</h3>
        <div className="space-y-1">
          {courses.map((course) => (
            <button
              key={course._id}
              type="button"
              onClick={() => onSelectCourse(course._id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition cursor-pointer ${
                selectedCourseId === course._id
                  ? "bg-blue-50 text-blue-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen size={16} className="shrink-0" />
              <span className="truncate">{course.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {!selected ? (
          <div className="p-10 text-center text-slate-500">
            Select a course from the left to view its content.
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 p-6">
              <img
                src={selected.imageUrl || fallbackImage}
                alt={selected.title}
                className="h-40 w-full rounded-xl object-cover mb-4"
              />
              <h3 className="text-xl font-extrabold text-slate-900">{selected.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
              <Link
                to={`/dashboard/learn/${selected._id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
              >
                <PlayCircle size={16} /> Open Course Player
              </Link>
            </div>

            <div className="p-6">
              <h4 className="font-bold text-slate-900 mb-4">Course Content</h4>
              {loadingContent[selectedCourseId] ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <p className="text-sm text-slate-500">No content published yet for this course.</p>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((item, idx) => {
                    const Icon = contentIcon[item.type] || FileText;
                    return (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => onOpenLesson(selected._id, item._id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50 cursor-pointer"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-xs font-bold text-white">
                            {idx + 1}
                          </span>
                          <Icon size={16} className="text-blue-800 shrink-0" />
                          <span className="flex-1 truncate text-sm font-semibold text-slate-800">
                            {item.title}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
        <Icon size={20} />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
    </article>
  );
}

export default UserDashboard;
