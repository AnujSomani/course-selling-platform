import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  Image,
  IndianRupee,
  Layers,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Menu,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  UserCircle,
  Video,
  X,
} from "lucide-react";
import API from "../api/axios";

const emptyCourseForm = {
  title: "",
  description: "",
  imageUrl: "",
  price: "",
  originalPrice: "",
  category: "",
  level: "Beginner",
};

const emptyContentForm = {
  type: "video",
  title: "",
  url: "",
  text: "",
  order: "",
  isPreview: false,
};

const levels = ["Beginner", "Intermediate", "Advanced"];
const contentTypes = [
  { value: "video", label: "Video", icon: Video },
  { value: "pdf",   label: "PDF",   icon: FileText },
  { value: "link",  label: "Link",  icon: LinkIcon },
  { value: "text",  label: "Text",  icon: FileText },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format";

const MOMENTUM_BARS   = [32, 48, 41, 63, 57, 78];
const MOMENTUM_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// ─── helpers ─────────────────────────────────────────────────────────────────
function getAdminInfo() {
  const email    = localStorage.getItem("adminEmail") || "admin@skillhub.com";
  const initials =
    email
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "AD";
  return { email, initials };
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const profileRef   = useRef(null);

  const initialSection = new URLSearchParams(location.search).get("section");
  const [activeSection,      setActiveSection]      = useState(initialSection === "courses" ? "courses" : "dashboard");
  const [sidebarOpen,        setSidebarOpen]        = useState(true);
  const [mobileSidebarOpen,  setMobileSidebarOpen]  = useState(false);
  const [profileOpen,        setProfileOpen]        = useState(false);
  const [courses,            setCourses]            = useState([]);
  const [contents,           setContents]           = useState([]);
  const [courseForm,         setCourseForm]         = useState(emptyCourseForm);
  const [contentForm,        setContentForm]        = useState(emptyContentForm);
  const [editingCourseId,    setEditingCourseId]    = useState("");
  const [editingContentId,   setEditingContentId]   = useState("");
  const [selectedCourseId,   setSelectedCourseId]   = useState("");
  const [loadingCourses,     setLoadingCourses]     = useState(true);
  const [loadingContent,     setLoadingContent]     = useState(false);
  const [savingCourse,       setSavingCourse]       = useState(false);
  const [savingContent,      setSavingContent]      = useState(false);
  const [deletingCourseId,   setDeletingCourseId]   = useState("");
  const [deletingContentId,  setDeletingContentId]  = useState("");
  const [courseSearch,       setCourseSearch]       = useState("");

  const { email: adminEmail, initials: adminInitials } = getAdminInfo();

  const selectedCourse  = courses.find((c) => c._id === selectedCourseId);
  const filteredCourses = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((c) =>
      [c.title, c.category, c.level].some((v) =>
        String(v || "").toLowerCase().includes(term)
      )
    );
  }, [courses, courseSearch]);

  const stats = useMemo(() => {
    const learners     = courses.reduce((t, c) => t + (c.totalStudents || 0), 0);
    const categories   = new Set(courses.map((c) => c.category).filter(Boolean)).size;
    const value        = courses.reduce((t, c) => t + Number(c.price || 0), 0);
    const previewItems = contents.filter((c) => c.isPreview).length;
    return { learners, categories, value, previewItems };
  }, [courses, contents]);

  // close profile dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // load courses
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingCourses(true);
        const res = await API.get("/admin/bulk");
        const list = res.data.courses || [];
        if (!ignore) {
          setCourses(list);
          setSelectedCourseId((cur) => cur || list[0]?._id || "");
        }
      } catch (err) {
        if (!ignore) toast.error(err.response?.data?.message || "Failed to load courses.");
      } finally {
        if (!ignore) setLoadingCourses(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  // load content for selected course
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!selectedCourseId) { setContents([]); return; }
      try {
        setLoadingContent(true);
        const res = await API.get(`/admin/courses/${selectedCourseId}/content`);
        if (!ignore) setContents(res.data.contents || []);
      } catch (err) {
        if (!ignore) toast.error(err.response?.data?.message || "Unable to load content.");
      } finally {
        if (!ignore) setLoadingContent(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [selectedCourseId]);

  async function refreshCourses() {
    try {
      setLoadingCourses(true);
      const res  = await API.get("/admin/bulk");
      const list = res.data.courses || [];
      setCourses(list);
      setSelectedCourseId((cur) => cur || list[0]?._id || "");
      toast.success("Courses refreshed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to refresh.");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function refreshContent(courseId = selectedCourseId) {
    if (!courseId) return;
    try {
      setLoadingContent(true);
      const res = await API.get(`/admin/courses/${courseId}/content`);
      setContents(res.data.contents || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to refresh content.");
    } finally {
      setLoadingContent(false);
    }
  }

  function openSection(section) {
    setActiveSection(section);
    setMobileSidebarOpen(false);
    setProfileOpen(false);
    if (section !== "courses") navigate("/admin/dashboard", { replace: true });
  }

  function handleLogout() {
    ["adminToken", "userToken", "role", "adminEmail", "userEmail"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/");
  }

  function resetCourseForm()  { setEditingCourseId("");  setCourseForm(emptyCourseForm);  }
  function resetContentForm() { setEditingContentId(""); setContentForm(emptyContentForm); }

  function handleCourseChange(e) {
    const { name, value } = e.target;
    setCourseForm((c) => ({ ...c, [name]: value }));
  }

  function handleContentChange(e) {
    const { name, value, type, checked } = e.target;
    setContentForm((c) => ({ ...c, [name]: type === "checkbox" ? checked : value }));
  }

  function startCreateCourse() { resetCourseForm(); openSection("create"); }

  function startEditCourse(course) {
    setEditingCourseId(course._id);
    setCourseForm({
      title:         course.title         || "",
      description:   course.description   || "",
      imageUrl:      course.imageUrl       || "",
      price:         course.price          ?? "",
      originalPrice: course.originalPrice  ?? "",
      category:      course.category       || "",
      level:         course.level          || "Beginner",
    });
    openSection("create");
  }

  function manageContent(course) {
    setSelectedCourseId(course._id);
    resetContentForm();
    openSection("content");
  }

  function buildCoursePayload() {
    const p = {
      title:       courseForm.title.trim(),
      description: courseForm.description.trim(),
      imageUrl:    courseForm.imageUrl.trim(),
      price:       Number(courseForm.price),
      category:    courseForm.category.trim(),
      level:       courseForm.level,
    };
    if (courseForm.originalPrice !== "") p.originalPrice = Number(courseForm.originalPrice);
    return p;
  }

  async function handleCourseSubmit(e) {
    e.preventDefault();
    const payload = buildCoursePayload();
    if (!payload.title || Number.isNaN(payload.price) || payload.price <= 0) {
      toast.error("Add a course title and a valid price.");
      return;
    }
    try {
      setSavingCourse(true);
      let courseId = editingCourseId;
      if (editingCourseId) {
        await API.put("/admin/courses", { courseId: editingCourseId, ...payload });
        toast.success("Course updated.");
      } else {
        const res = await API.post("/admin/courses", payload);
        courseId  = res.data.courseId;
        toast.success("Course created. Add content next.");
      }
      const res = await API.get("/admin/bulk");
      setCourses(res.data.courses || []);
      setSelectedCourseId(courseId);
      resetCourseForm();
      openSection("content");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save course.");
    } finally {
      setSavingCourse(false);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete "${course.title || "this course"}"?`)) return;
    try {
      setDeletingCourseId(course._id);
      await API.delete(`/admin/courses/${course._id}`);
      setCourses((list) => list.filter((c) => c._id !== course._id));
      if (selectedCourseId === course._id) { setSelectedCourseId(""); setContents([]); }
      toast.success("Course deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete course.");
    } finally {
      setDeletingCourseId("");
    }
  }

  function buildContentPayload() {
    const p = {
      type:      contentForm.type,
      title:     contentForm.title.trim(),
      order:     contentForm.order === "" ? 0 : Number(contentForm.order),
      isPreview: contentForm.isPreview,
    };
    if (contentForm.type === "text") p.text = contentForm.text.trim();
    else p.url = contentForm.url.trim();
    return p;
  }

  async function handleContentSubmit(e) {
    e.preventDefault();
    if (!selectedCourseId) { toast.error("Select a course first."); return; }
    const payload = buildContentPayload();
    if (!payload.title || Number.isNaN(payload.order)) {
      toast.error("Add a title and a valid order.");
      return;
    }
    if ((payload.type === "text" && !payload.text) || (payload.type !== "text" && !payload.url)) {
      toast.error(payload.type === "text" ? "Add lesson text." : "Add a content URL.");
      return;
    }
    try {
      setSavingContent(true);
      if (editingContentId) {
        await API.put(`/admin/content/${editingContentId}`, payload);
        toast.success("Content updated.");
      } else {
        await API.post(`/admin/courses/${selectedCourseId}/content`, payload);
        toast.success("Content added.");
      }
      resetContentForm();
      await refreshContent(selectedCourseId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save content.");
    } finally {
      setSavingContent(false);
    }
  }

  function startEditContent(content) {
    setEditingContentId(content._id);
    setContentForm({
      type:      content.type      || "video",
      title:     content.title     || "",
      url:       content.url       || "",
      text:      content.text      || "",
      order:     content.order     ?? "",
      isPreview: !!content.isPreview,
    });
  }

  async function deleteContent(content) {
    if (!window.confirm(`Delete "${content.title || "this content"}"?`)) return;
    try {
      setDeletingContentId(content._id);
      await API.delete(`/admin/content/${content._id}`);
      setContents((list) => list.filter((c) => c._id !== content._id));
      if (editingContentId === content._id) resetContentForm();
      toast.success("Content deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete content.");
    } finally {
      setDeletingContentId("");
    }
  }

  const sectionLabels = {
    dashboard: "Dashboard",
    courses:   "Your Courses",
    create:    "Create Course",
    content:   "Course Content",
  };

  // profile dropdown items — mirrors Navbar admin menu
  const profileMenuItems = [
    { label: "Dashboard",    onClick: () => openSection("dashboard"), icon: BarChart3 },
    { label: "Your Courses", onClick: () => openSection("courses"),   icon: BookOpen  },
    { label: "My Profile",   to: "/profile",                          icon: UserCircle },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <Toaster position="top-right" />

      {/* mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width:     sidebarOpen ? "260px" : "72px",
          minWidth:  sidebarOpen ? "260px" : "72px",
          transition: "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0b1f3a] text-white overflow-hidden",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 font-black text-sm text-white">
              S
            </div>
            {sidebarOpen && (
              <span className="whitespace-nowrap font-extrabold tracking-tight">
                Skill<span className="text-blue-400">Hub</span>
              </span>
            )}
          </div>
          {/* collapse — desktop */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {/* close — mobile */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex lg:hidden h-7 w-7 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2 py-4">
          <NavGroup
            title="Overview"
            open={sidebarOpen}
            items={[{ id: "dashboard", label: "Dashboard", icon: BarChart3 }]}
            active={activeSection}
            onSelect={openSection}
          />
          <NavGroup
            title="Catalog"
            open={sidebarOpen}
            items={[
              { id: "courses", label: "Courses",       icon: BookOpen   },
              { id: "create",  label: "Create Course", icon: PlusCircle },
              { id: "content", label: "Add Content",   icon: Layers     },
            ]}
            active={activeSection}
            onSelect={(id) => id === "create" ? startCreateCourse() : openSection(id)}
          />
          <NavGroup
            title="Account"
            open={sidebarOpen}
            items={[{ id: "profile", label: "My Profile", icon: UserCircle, href: "/profile" }]}
            active={activeSection}
            onSelect={openSection}
          />
        </nav>

        {/* logout */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={[
              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold",
              "text-white/60 transition hover:bg-white/10 hover:text-white",
              sidebarOpen ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <LogOut size={17} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          {/* mobile burger */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          {/* page title */}
          <h1 className="hidden lg:block text-lg font-bold text-slate-900">
            {sectionLabels[activeSection] || "Dashboard"}
          </h1>

          {/* right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* view site */}
            <Link
              to="/"
              className="hidden sm:inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Eye size={15} />
              View site
            </Link>

            {/* refresh */}
            <button
              type="button"
              onClick={refreshCourses}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            {/* ── PROFILE DROPDOWN ── */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white transition hover:bg-blue-800 ring-4 ring-blue-50 hover:ring-blue-100"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                title={adminEmail}
              >
                {adminInitials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  {/* email header */}
                  <div className="px-3 py-2 mb-1 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{adminEmail}</p>
                  </div>

                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    if (item.to) {
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-blue-900"
                        >
                          <Icon size={17} />
                          {item.label}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-blue-900"
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}

                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 px-4 py-6 sm:px-6">
          {activeSection === "dashboard" && (
            <DashboardHome
              courses={courses}
              contents={contents}
              stats={stats}
              loading={loadingCourses}
              onCreateCourse={startCreateCourse}
              onManageContent={manageContent}
              onOpenCourses={() => openSection("courses")}
            />
          )}
          {activeSection === "courses" && (
            <CoursesPanel
              courses={filteredCourses}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              loading={loadingCourses}
              deletingCourseId={deletingCourseId}
              onCreateCourse={startCreateCourse}
              onEditCourse={startEditCourse}
              onDeleteCourse={deleteCourse}
              onManageContent={manageContent}
            />
          )}
          {activeSection === "create" && (
            <CourseFormPanel
              courseForm={courseForm}
              editingCourseId={editingCourseId}
              savingCourse={savingCourse}
              onChange={handleCourseChange}
              onSubmit={handleCourseSubmit}
              onCancel={resetCourseForm}
            />
          )}
          {activeSection === "content" && (
            <ContentPanel
              courses={courses}
              selectedCourseId={selectedCourseId}
              selectedCourse={selectedCourse}
              contents={contents}
              contentForm={contentForm}
              editingContentId={editingContentId}
              loadingContent={loadingContent}
              savingContent={savingContent}
              deletingContentId={deletingContentId}
              onSelectCourse={(id) => { setSelectedCourseId(id); resetContentForm(); }}
              onChange={handleContentChange}
              onSubmit={handleContentSubmit}
              onEditContent={startEditContent}
              onDeleteContent={deleteContent}
              onCancelEdit={resetContentForm}
              onCreateCourse={startCreateCourse}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({ title, items, active, onSelect, open }) {
  return (
    <div>
      {open && (
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon   = item.icon;
          const isActive = active === item.id;
          const cls = [
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition",
            open ? "justify-start" : "justify-center",
            isActive
              ? "bg-white/10 text-white"
              : "text-white/50 hover:bg-white/10 hover:text-white",
          ].join(" ");

          // items with href render as <Link>
          if (item.href) {
            return (
              <Link key={item.id} to={item.href} className={cls}>
                <Icon size={17} className="shrink-0" />
                {open && <span className="truncate text-sm font-semibold">{item.label}</span>}
              </Link>
            );
          }
          return (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={cls}>
              <Icon size={17} className="shrink-0" />
              {open && <span className="truncate text-sm font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DashboardHome ────────────────────────────────────────────────────────────
function DashboardHome({ courses, contents, stats, loading, onCreateCourse, onManageContent, onOpenCourses }) {
  const topCourses = courses.slice(0, 4);
  const maxBar     = Math.max(...MOMENTUM_BARS);

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="rounded-xl bg-[#0b1f3a] px-6 py-8 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Admin Studio</p>
        <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Build, organize &amp; publish your catalog.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-200">
          Create courses, upload content, and track your catalog — all from one workspace.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCreateCourse}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-blue-950 transition hover:bg-blue-50"
          >
            <PlusCircle size={16} /> Create Course
          </button>
          <button
            type="button"
            onClick={onOpenCourses}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <BookOpen size={16} /> View Courses
          </button>
        </div>
      </section>

      {/* metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Courses" value={courses.length}                                      icon={BookOpen}    tone="blue"   />
        <MetricCard label="Total Learners" value={stats.learners.toLocaleString("en-IN")}              icon={UserCircle}  tone="green"  />
        <MetricCard label="Categories"     value={stats.categories}                                    icon={Layers}      tone="violet" />
        <MetricCard label="Catalog Value"  value={"Rs " + stats.value.toLocaleString("en-IN")}         icon={IndianRupee} tone="amber"  />
      </section>

      {/* charts */}
      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* momentum */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Catalog Momentum</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {courses.length > 0
                  ? courses.length + " courses published — preview trend"
                  : "Sample trend — publish courses to see real data"}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">6 months</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {MOMENTUM_BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-blue-900 transition-all duration-500 hover:bg-blue-700"
                  style={{ height: (h / maxBar) * 100 + "%" }}
                />
                <span className="text-[11px] font-semibold text-slate-400">{MOMENTUM_MONTHS[i]}</span>
              </div>
            ))}
          </div>
          {courses.length === 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
              Create your first course to start tracking real enrollment data.
            </p>
          )}
        </div>

        {/* content mix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Content Mix</h3>
          <p className="mt-0.5 text-xs text-slate-500">{contents.length} items on selected course</p>
          <div className="mt-5 space-y-4">
            {contentTypes.map((type) => {
              const count = contents.filter((c) => c.type === type.value).length;
              const pct   = contents.length ? Math.max(8, (count / contents.length) * 100) : 8;
              return (
                <div key={type.value}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{type.label}</span>
                    <span className="text-blue-900">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-900 transition-all duration-500" style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
            {stats.previewItems} preview item{stats.previewItems !== 1 ? "s" : ""} visible to learners
          </div>
        </div>
      </section>

      {/* top courses */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Top Courses</h3>
            <p className="mt-0.5 text-xs text-slate-500">Quick access to your latest course work</p>
          </div>
          <button type="button" onClick={onOpenCourses} className="text-xs font-bold text-blue-900 hover:underline">
            View all
          </button>
        </div>
        {loading ? (
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : topCourses.length === 0 ? (
          <EmptyState title="No courses yet" text="Create your first course to start building your catalog." action="Create Course" onAction={onCreateCourse} />
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {topCourses.map((course) => (
              <CourseMiniCard key={course._id} course={course} onManageContent={onManageContent} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, tone }) {
  const tones = {
    blue:   "bg-blue-50 text-blue-800",
    green:  "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber:  "bg-amber-50 text-amber-700",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className={"flex h-10 w-10 items-center justify-center rounded-lg " + tones[tone]}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
    </article>
  );
}

// ─── CoursesPanel ─────────────────────────────────────────────────────────────
function CoursesPanel({ courses, courseSearch, setCourseSearch, loading, deletingCourseId, onCreateCourse, onEditCourse, onDeleteCourse, onManageContent }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Your Courses</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage every course and jump into content creation.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 sm:w-64">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Search courses…"
            />
          </label>
          <button
            type="button"
            onClick={onCreateCourse}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            <PlusCircle size={15} /> Add Course
          </button>
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState title="No matching courses" text="Create a new course or clear your search." action="Add Course" onAction={onCreateCourse} />
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {courses.map((course) => (
            <article key={course._id} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
                <img src={course.imageUrl || fallbackImage} alt={course.title || "Course"} className="h-32 w-full rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800">{course.level || "Beginner"}</span>
                    {course.category && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{course.category}</span>
                    )}
                  </div>
                  <h3 className="mt-2 truncate font-extrabold text-slate-950">{course.title || "Untitled Course"}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{course.description || "No description added yet."}</p>
                  <p className="mt-2 font-extrabold text-blue-900">Rs {Number(course.price || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <button type="button" onClick={() => onManageContent(course)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-xs font-bold text-white transition hover:bg-blue-800">
                  <PlusCircle size={14} /> Add Content
                </button>
                <button type="button" onClick={() => onEditCourse(course)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCourse(course)}
                  disabled={deletingCourseId === course._id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingCourseId === course._id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── CourseFormPanel ──────────────────────────────────────────────────────────
function CourseFormPanel({ courseForm, editingCourseId, savingCourse, onChange, onSubmit, onCancel }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-800">Course Builder</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950">
            {editingCourseId ? "Edit course details" : "Create a new course"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">After saving you'll move straight into the content editor.</p>
        </div>
        <div className="grid gap-5 p-6">
          <FormInput label="Course title" name="title" value={courseForm.title} onChange={onChange} placeholder="Full Stack Web Development" required />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea name="description" value={courseForm.description} onChange={onChange} rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="What will students build and finish?" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Cover image URL</span>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 px-3 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
              <Image className="mr-2 shrink-0 text-slate-400" size={16} />
              <input name="imageUrl" value={courseForm.imageUrl} onChange={onChange} className="w-full py-3 text-sm outline-none" placeholder="https://..." />
            </div>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Sale price (Rs)" name="price" value={courseForm.price} onChange={onChange} placeholder="4999" type="number" min="1" required />
            <FormInput label="Original price (Rs)" name="originalPrice" value={courseForm.originalPrice} onChange={onChange} placeholder="7999" type="number" min="0" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Category" name="category" value={courseForm.category} onChange={onChange} placeholder="Web Development" />
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Level</span>
              <select name="level" value={courseForm.level} onChange={onChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="submit" disabled={savingCourse}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-900 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
              {savingCourse ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {editingCourseId ? "Update & Add Content" : "Create & Add Content"}
            </button>
            {editingCourseId && (
              <button type="button" onClick={onCancel}
                className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
      <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50 p-6">
        <h3 className="font-bold text-blue-950">Publishing flow</h3>
        <div className="mt-5 space-y-4">
          {["Create the course shell", "Add lessons and resources", "Mark previews for free samples", "Keep your catalog fresh"].map((step, i) => (
            <div key={step} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-900 text-[11px] font-bold text-white">{i + 1}</div>
              <p className="text-sm font-semibold leading-6 text-blue-950">{step}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

// ─── ContentPanel ─────────────────────────────────────────────────────────────
function ContentPanel({ courses, selectedCourseId, selectedCourse, contents, contentForm, editingContentId, loadingContent, savingContent, deletingContentId, onSelectCourse, onChange, onSubmit, onEditContent, onDeleteContent, onCancelEdit, onCreateCourse }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
      <form onSubmit={onSubmit} className="h-fit rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-800">Content Studio</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950">{editingContentId ? "Edit content" : "Add content"}</h2>
          <p className="mt-1 text-sm text-slate-500">Attach videos, PDFs, links, or text lessons.</p>
        </div>
        <div className="grid gap-5 p-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Course</span>
            <select value={selectedCourseId} onChange={(e) => onSelectCourse(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="">Select a course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title || "Untitled Course"}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {contentTypes.map((type) => {
                const Icon   = type.icon;
                const active = contentForm.type === type.value;
                return (
                  <label key={type.value}
                    className={"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition " +
                      (active ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                    <input type="radio" name="type" value={type.value} checked={active} onChange={onChange} className="sr-only" />
                    <Icon size={15} /> {type.label}
                  </label>
                );
              })}
            </div>
          </label>
          <FormInput label="Title" name="title" value={contentForm.title} onChange={onChange} placeholder="Introduction to the course" required />
          {contentForm.type === "text" ? (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Lesson text</span>
              <textarea name="text" value={contentForm.text} onChange={onChange} rows={5} required
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Write lesson notes here." />
            </label>
          ) : (
            <FormInput label="URL" name="url" value={contentForm.url} onChange={onChange} placeholder="https://..." required />
          )}
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <FormInput label="Order" name="order" value={contentForm.order} onChange={onChange} placeholder="1" type="number" min="0" />
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <input type="checkbox" name="isPreview" checked={contentForm.isPreview} onChange={onChange} className="h-4 w-4 accent-blue-900" />
              Preview
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={savingContent || !selectedCourseId}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-900 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
              {savingContent ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {editingContentId ? "Update" : "Add Content"}
            </button>
            {editingContentId && (
              <button type="button" onClick={onCancelEdit}
                className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Content Library</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {selectedCourse ? selectedCourse.title : "Choose a course to manage content."}
            </p>
          </div>
          {!selectedCourse && (
            <button type="button" onClick={onCreateCourse}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-xs font-bold text-white transition hover:bg-blue-800">
              <PlusCircle size={14} /> Create Course
            </button>
          )}
        </div>
        {loadingContent ? (
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : contents.length === 0 ? (
          <EmptyState title="No content yet" text="Add your first lesson, PDF, link, or text resource." />
        ) : (
          <div className="divide-y divide-slate-100">
            {contents.map((content) => {
              const typeMeta = contentTypes.find((t) => t.value === content.type) || contentTypes[0];
              const Icon     = typeMeta.icon;
              return (
                <article key={content._id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold capitalize text-slate-600">{content.type}</span>
                      {content.isPreview && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">Preview</span>}
                      <span className="text-[11px] font-semibold text-slate-400">#{content.order || 0}</span>
                    </div>
                    <h4 className="mt-1 font-bold text-slate-950">{content.title}</h4>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {content.type === "text" ? content.text : content.url}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => onEditContent(content)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                      <Edit3 size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => onDeleteContent(content)} disabled={deletingContentId === content._id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                      {deletingContentId === content._id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── CourseMiniCard ───────────────────────────────────────────────────────────
function CourseMiniCard({ course, onManageContent }) {
  return (
    <article className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <img src={course.imageUrl || fallbackImage} alt={course.title || "Course"} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-extrabold text-slate-950">{course.title || "Untitled Course"}</h4>
        <p className="mt-0.5 text-xs text-slate-500">{course.category || "General"} · {course.level || "Beginner"}</p>
        <button type="button" onClick={() => onManageContent(course)} className="mt-2 text-xs font-bold text-blue-900 hover:underline">
          Add content →
        </button>
      </div>
    </article>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────────
function FormInput({ label, name, value, onChange, placeholder, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type}
        className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        {...props} />
    </label>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-900">
        <BookOpen size={26} />
      </div>
      <h3 className="mt-4 font-extrabold text-slate-950">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-6 text-slate-500">{text}</p>
      {action && (
        <button type="button" onClick={onAction}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-900 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
          {action}
        </button>
      )}
    </div>
  );
}

export default AdminDashboard;