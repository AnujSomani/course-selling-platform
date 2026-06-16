import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
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
  Trash2,
  UserCircle,
  Video,
  X,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import VideoUploader from "../components/VideoUploader";

const emptyCourseForm = {
  title: "", description: "", imageUrl: "", price: "",
  originalPrice: "", category: "", level: "Beginner",
};

const emptyContentForm = {
  type: "video", title: "", url: "", text: "", order: "", isPreview: false,
};

const levels = ["Beginner", "Intermediate", "Advanced"];

const contentTypes = [
  { value: "video", label: "Video",    icon: Video    },
  { value: "pdf",   label: "PDF",      icon: FileText },
  { value: "link",  label: "Link",     icon: LinkIcon },
  { value: "text",  label: "Text",     icon: FileText },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format";


function getAdminInfo() {
  const email = localStorage.getItem("adminEmail") || "admin@upskilio.com";
  const initials =
    email.split("@")[0].split(/[._-]/).filter(Boolean).slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase()).join("") || "AD";
  return { email, initials };
}

function AdminDashboard() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { logout } = useAuth();
  const profileRef = useRef(null);

  const initialSection = new URLSearchParams(location.search).get("section");
  const [activeSection,     setActiveSection]     = useState(initialSection === "courses" ? "courses" : "dashboard");
  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen,       setProfileOpen]       = useState(false);
  const [courses,           setCourses]           = useState([]);
  const [contents,          setContents]          = useState([]);
  const [courseForm,        setCourseForm]        = useState(emptyCourseForm);
  const [contentForm,       setContentForm]       = useState(emptyContentForm);
  const [editingCourseId,   setEditingCourseId]   = useState("");
  const [editingContentId,  setEditingContentId]  = useState("");
  const [selectedCourseId,  setSelectedCourseId]  = useState("");
  const [loadingCourses,    setLoadingCourses]    = useState(true);
  const [loadingContent,    setLoadingContent]    = useState(false);
  const [savingCourse,      setSavingCourse]      = useState(false);
  const [savingContent,     setSavingContent]     = useState(false);
  const [deletingCourseId,  setDeletingCourseId]  = useState("");
  const [deletingContentId, setDeletingContentId] = useState("");
  const [courseSearch,      setCourseSearch]      = useState("");

  const { email: adminEmail, initials: adminInitials } = getAdminInfo();

  const selectedCourse  = courses.find((c) => c._id === selectedCourseId);
  const filteredCourses = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((c) =>
      [c.title, c.category, c.level].some((v) => String(v || "").toLowerCase().includes(term))
    );
  }, [courses, courseSearch]);

  const stats = useMemo(() => {
    const learners   = courses.reduce((t, c) => t + (c.totalStudents || 0), 0);
    const categories = new Set(courses.map((c) => c.category).filter(Boolean)).size;
    const value      = courses.reduce((t, c) => t + Number(c.price || 0), 0);
    const previews   = contents.filter((c) => c.isPreview).length;
    return { learners, categories, value, previews };
  }, [courses, contents]);

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load courses
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingCourses(true);
        const res  = await API.get("/admin/bulk");
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
    logout();
    toast.success("Signed out");
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
    setContentForm((c) => {
      const updated = { ...c, [name]: type === "checkbox" ? checked : value };
      // Reset URL when content type changes so a stale S3 key never carries over
      if (name === "type") updated.url = "";
      return updated;
    });
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
    if (!payload.title || Number.isNaN(payload.price) || payload.price < 0) {
      toast.error("Add a course title and a valid price (0 for free).");
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
    if (!window.confirm(`Delete "${course.title || "this course"}" and all its content? This cannot be undone.`)) return;
    try {
      setDeletingCourseId(course._id);
      await API.delete(`/admin/courses/${course._id}`);
      setCourses((list) => list.filter((c) => c._id !== course._id));
      if (selectedCourseId === course._id) { setSelectedCourseId(""); setContents([]); resetContentForm(); }
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
    if (!payload.title || Number.isNaN(payload.order)) { toast.error("Add a title and a valid order."); return; }
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

  const profileMenuItems = [
    { label: "My Dashboard",  onClick: () => openSection("dashboard"), icon: BarChart3   },
    { label: "Your Courses",  onClick: () => openSection("courses"),   icon: BookOpen    },
    { label: "My Profile",    to: "/profile",                          icon: UserCircle  },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">

      {mobileSidebarOpen && (
        <button type="button" aria-label="Close sidebar" onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width:    sidebarOpen ? "240px" : "64px",
          minWidth: sidebarOpen ? "240px" : "64px",
          transition: "width 260ms cubic-bezier(0.4,0,0.2,1), min-width 260ms cubic-bezier(0.4,0,0.2,1)",
        }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden",
          "bg-white border-r border-slate-200",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 font-black text-sm text-white">
              S
            </div>
            {sidebarOpen && (
              <span className="whitespace-nowrap font-extrabold tracking-tight text-slate-900">
                Upskil<span className="text-blue-600">io</span>
              </span>
            )}
          </div>
          <button type="button" onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {/* Mobile close */}
          <button type="button" onClick={() => setMobileSidebarOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-5">
          <NavGroup title="Overview" open={sidebarOpen}
            items={[{ id: "dashboard", label: "Dashboard", icon: BarChart3 }]}
            active={activeSection} onSelect={openSection} />
          <NavGroup title="Catalog" open={sidebarOpen}
            items={[
              { id: "courses", label: "All Courses",    icon: BookOpen   },
              { id: "create",  label: "Create Course",  icon: PlusCircle },
              { id: "content", label: "Content Studio", icon: Layers     },
            ]}
            active={activeSection}
            onSelect={(id) => id === "create" ? startCreateCourse() : openSection(id)} />
          <NavGroup title="Account" open={sidebarOpen}
            items={[{ id: "profile", label: "My Profile", icon: UserCircle, href: "/profile" }]}
            active={activeSection} onSelect={openSection} />
        </nav>

      
        <div className="shrink-0 border-t border-slate-100 p-3">
          <button type="button" onClick={handleLogout}
            className={[
              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold",
              "text-slate-500 transition hover:bg-red-50 hover:text-red-600",
              sidebarOpen ? "justify-start" : "justify-center",
            ].join(" ")}>
            <LogOut size={17} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

  
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button type="button" onClick={() => setMobileSidebarOpen(true)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            aria-label="Open sidebar">
            <Menu size={18} />
          </button>

          <h1 className="hidden lg:block text-base font-bold text-slate-900">
            {sectionLabels[activeSection] || "Dashboard"}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/"
              className="hidden sm:inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              <Eye size={15} /> View site
            </Link>
            <button type="button" onClick={refreshCourses}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Refresh">
              <RefreshCw size={15} />
            </button>

          
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white transition hover:bg-blue-800 ring-2 ring-blue-100"
                aria-expanded={profileOpen} aria-label="Open profile menu" title={adminEmail}>
                {adminInitials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="px-3 py-2 mb-1 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{adminEmail}</p>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    if (item.to) {
                      return (
                        <Link key={item.label} to={item.to} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          <Icon size={16} className="text-slate-400" /> {item.label}
                        </Link>
                      );
                    }
                    return (
                      <button key={item.label} type="button" onClick={item.onClick}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        <Icon size={16} className="text-slate-400" /> {item.label}
                      </button>
                    );
                  })}
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button type="button" onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6">
          {activeSection === "dashboard" && (
            <DashboardHome courses={courses} contents={contents} stats={stats}
              loading={loadingCourses} onCreateCourse={startCreateCourse}
              onManageContent={manageContent} onOpenCourses={() => openSection("courses")} />
          )}
          {activeSection === "courses" && (
            <CoursesPanel courses={filteredCourses} courseSearch={courseSearch}
              setCourseSearch={setCourseSearch} loading={loadingCourses}
              onCreateCourse={startCreateCourse} onEditCourse={startEditCourse}
              onManageContent={manageContent} onDeleteCourse={deleteCourse}
              deletingCourseId={deletingCourseId} />
          )}
          {activeSection === "create" && (
            <CourseFormPanel courseForm={courseForm} editingCourseId={editingCourseId}
              savingCourse={savingCourse} onChange={handleCourseChange}
              onSubmit={handleCourseSubmit} onCancel={resetCourseForm} />
          )}
          {activeSection === "content" && (
            <ContentPanel courses={courses} selectedCourseId={selectedCourseId}
              selectedCourse={selectedCourse} contents={contents} contentForm={contentForm}
              editingContentId={editingContentId} loadingContent={loadingContent}
              savingContent={savingContent} deletingContentId={deletingContentId}
              onSelectCourse={(id) => { setSelectedCourseId(id); resetContentForm(); }}
              onChange={handleContentChange} onSubmit={handleContentSubmit}
              onEditContent={startEditContent} onDeleteContent={deleteContent}
              onCancelEdit={resetContentForm} onCreateCourse={startCreateCourse}
              onUploadComplete={(s3Key) => setContentForm((c) => ({ ...c, url: s3Key }))} />
          )}
        </main>
      </div>
    </div>
  );
}

function NavGroup({ title, items, active, onSelect, open }) {
  return (
    <div>
      {open && (
        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon     = item.icon;
          const isActive = active === item.id;
          const cls = [
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition",
            open ? "justify-start" : "justify-center",
            isActive
              ? "bg-blue-50 text-blue-900 font-bold"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-semibold",
          ].join(" ");
          if (item.href) {
            return (
              <Link key={item.id} to={item.href} className={cls}>
                <Icon size={17} className="shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            );
          }
          return (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={cls}>
              <Icon size={17} className="shrink-0" />
              {open && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DashboardHome({ courses, contents, stats, loading, onCreateCourse, onManageContent, onOpenCourses }) {
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <section className="rounded-2xl bg-gradient-to-br from-[#0b1f3a] to-blue-900 px-7 py-8 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Admin Studio</p>
        <h2 className="mt-2 text-2xl font-extrabold">Build, organize &amp; publish your catalog.</h2>
        <p className="mt-1.5 max-w-lg text-sm text-blue-200 leading-6">
          Create courses, upload content, and grow your learner base — all in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCreateCourse}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-blue-900 transition hover:bg-blue-50">
            <PlusCircle size={15} /> Create Course
          </button>
          <button type="button" onClick={onOpenCourses}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20">
            <BookOpen size={15} /> View Courses
          </button>
        </div>
      </section>

     
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Courses"  value={courses.length}                               icon={BookOpen}    color="blue"   />
        <MetricCard label="Total Learners"  value={stats.learners.toLocaleString("en-IN")}       icon={UserCircle}  color="green"  />
        <MetricCard label="Categories"      value={stats.categories}                             icon={Layers}      color="violet" />
        <MetricCard label="Catalog Value"   value={"₹" + stats.value.toLocaleString("en-IN")}   icon={IndianRupee} color="amber"  />
      </section>

    
      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Recent courses */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Recent Courses</h3>
              <p className="mt-0.5 text-xs text-slate-500">Your latest published work</p>
            </div>
            <button type="button" onClick={onOpenCourses}
              className="text-xs font-bold text-blue-900 hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState title="No courses yet" text="Create your first course to get started."
              action="Create Course" onAction={onCreateCourse} />
          ) : (
            <div className="divide-y divide-slate-100">
              {courses.slice(0, 5).map((course) => (
                <div key={course._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition">
                  <img src={course.imageUrl || fallbackImage} alt={course.title || "Course"}
                    className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{course.title || "Untitled"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {course.category || "General"} · {course.level || "Beginner"} · ₹{Number(course.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button type="button" onClick={() => onManageContent(course)}
                    className="shrink-0 text-xs font-bold text-blue-900 hover:underline whitespace-nowrap">
                    + Content
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content mix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Content Mix</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {contents.length} item{contents.length !== 1 ? "s" : ""} in selected course
          </p>
          <div className="mt-5 space-y-4">
            {contentTypes.map((type) => {
              const count = contents.filter((c) => c.type === type.value).length;
              const pct   = contents.length ? Math.round((count / contents.length) * 100) : 0;
              return (
                <div key={type.value}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{type.label}</span>
                    <span className="text-blue-900">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: count > 0 ? `${Math.max(10, pct)}%` : "0%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
            {stats.previews} preview item{stats.previews !== 1 ? "s" : ""} visible to learners
          </div>
        </div>
      </section>
    </div>
  );
}


function MetricCard({ label, value, icon: MetricIcon, color }) {
  const colors = {
    blue:   { bg: "bg-blue-50",    text: "text-blue-900"   },
    green:  { bg: "bg-emerald-50", text: "text-emerald-600" },
    violet: { bg: "bg-violet-50",  text: "text-violet-600"  },
    amber:  { bg: "bg-amber-50",   text: "text-amber-600"   },
  };
  const c = colors[color] || colors.blue;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        <MetricIcon size={20} />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </article>
  );
}

function CoursesPanel({ courses, courseSearch, setCourseSearch, loading, onCreateCourse, onEditCourse, onManageContent, onDeleteCourse, deletingCourseId }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Your Courses</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage and publish your course catalog.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 sm:w-64">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Search courses…" />
          </label>
          <button type="button" onClick={onCreateCourse}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
            <PlusCircle size={15} /> Add Course
          </button>
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState title="No matching courses" text="Create a new course or clear your search."
          action="Add Course" onAction={onCreateCourse} />
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {courses.map((course) => (
            <article key={course._id} className="overflow-hidden rounded-xl border border-slate-100">
              <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
                <img src={course.imageUrl || fallbackImage} alt={course.title || "Course"}
                  className="h-32 w-full rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-900">{course.level || "Beginner"}</span>
                    {course.category && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{course.category}</span>
                    )}
                  </div>
                  <h3 className="mt-2 truncate font-bold text-slate-900">{course.title || "Untitled Course"}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{course.description || "No description yet."}</p>
                  <p className="mt-2 font-bold text-blue-900">₹{Number(course.price || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <button type="button" onClick={() => onManageContent(course)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-xs font-bold text-white transition hover:bg-blue-800">
                  <PlusCircle size={14} /> Add Content
                </button>
                <button type="button" onClick={() => onEditCourse(course)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                  <Edit3 size={14} /> Edit
                </button>
                <button type="button" onClick={() => onDeleteCourse(course)} disabled={deletingCourseId === course._id}
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                  {deletingCourseId === course._id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CourseFormPanel({ courseForm, editingCourseId, savingCourse, onChange, onSubmit, onCancel }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-900">Course Builder</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">
            {editingCourseId ? "Edit course details" : "Create a new course"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Fill in the details below then add content.</p>
        </div>
        <div className="grid gap-5 p-6">
          <FormInput label="Course title" name="title" value={courseForm.title} onChange={onChange}
            placeholder="Full Stack Web Development" required />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea name="description" value={courseForm.description} onChange={onChange} rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              placeholder="What will students build and finish?" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Cover image URL</span>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 px-3 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
              <Image className="mr-2 shrink-0 text-slate-400" size={16} />
              <input name="imageUrl" value={courseForm.imageUrl} onChange={onChange}
                className="w-full py-3 text-sm outline-none" placeholder="https://..." />
            </div>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Sale price (₹, 0 = free)" name="price" value={courseForm.price}
              onChange={onChange} placeholder="4999" type="number" min="0" required />
            <FormInput label="Original price (₹)" name="originalPrice" value={courseForm.originalPrice}
              onChange={onChange} placeholder="7999" type="number" min="0" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Category" name="category" value={courseForm.category}
              onChange={onChange} placeholder="Web Development" />
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Level</span>
              <select name="level" value={courseForm.level} onChange={onChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50">
                {levels.map((l) => <option key={l}>{l}</option>)}
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
        <h3 className="font-bold text-blue-900 text-sm">Publishing steps</h3>
        <div className="mt-4 space-y-3">
          {["Fill in course details", "Add lessons & resources", "Mark free previews", "Publish and grow"].map((step, i) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900 text-[10px] font-bold text-white mt-0.5">{i + 1}</div>
              <p className="text-sm text-blue-900 leading-5">{step}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function ContentPanel({ courses, selectedCourseId, selectedCourse, contents, contentForm, editingContentId, loadingContent, savingContent, deletingContentId, onSelectCourse, onChange, onSubmit, onEditContent, onDeleteContent, onCancelEdit, onCreateCourse, onUploadComplete }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={onSubmit} className="h-fit rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-900">Content Studio</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">{editingContentId ? "Edit content" : "Add content"}</h2>
          <p className="mt-1 text-sm text-slate-500">Attach videos, PDFs, links, or text lessons.</p>
        </div>
        <div className="grid gap-5 p-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Course</span>
            <select value={selectedCourseId} onChange={(e) => onSelectCourse(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50">
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
                      (active ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                    <input type="radio" name="type" value={type.value} checked={active} onChange={onChange} className="sr-only" />
                    <Icon size={15} /> {type.label}
                  </label>
                );
              })}
            </div>
          </label>
          <FormInput label="Title" name="title" value={contentForm.title} onChange={onChange}
            placeholder="Introduction to the course" required />
          {contentForm.type === "text" ? (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Lesson text</span>
              <textarea name="text" value={contentForm.text} onChange={onChange} rows={5} required
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                placeholder="Write lesson notes here." />
            </label>
          ) : contentForm.type === "link" ? (
            <FormInput label="URL" name="url" value={contentForm.url} onChange={onChange}
              placeholder="https://example.com/resource" required />
          ) : (
            /* video or pdf — use the uploader, URL auto-fills after upload */
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-slate-700">
                  {contentForm.type === "pdf" ? "Upload PDF" : "Upload video"}
                </span>
                {selectedCourseId ? (
                  <div className="mt-1.5">
                    <VideoUploader
                      courseId={selectedCourseId}
                      onUploadComplete={onUploadComplete}
                      key={`${selectedCourseId}-${contentForm.type}`}
                    />
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">Select a course above to enable upload.</p>
                )}
              </div>
          
              {contentForm.url ? (
                <div>
                  <span className="text-sm font-semibold text-slate-700">S3 Key</span>
                  <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="flex-1 truncate text-xs font-mono text-green-800">{contentForm.url}</span>
                    <button
                      type="button"
                      onClick={() => onUploadComplete("")}
                      className="text-xs text-slate-400 hover:text-red-500 transition shrink-0"
                      title="Clear and re-upload"
                    >
                      ✕
                    </button>
                  </div>
                  {/* hidden input keeps the url in the form so validation passes */}
                  <input type="hidden" name="url" value={contentForm.url} />
                </div>
              ) : (
                <FormInput
                  label="Or paste S3 key / URL manually"
                  name="url"
                  value={contentForm.url}
                  onChange={onChange}
                  placeholder="courses/abc123/videos/uuid-file.mp4"
                  required
                />
              )}
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <FormInput label="Order" name="order" value={contentForm.order} onChange={onChange}
              placeholder="1" type="number" min="0" />
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <input type="checkbox" name="isPreview" checked={contentForm.isPreview} onChange={onChange}
                className="h-4 w-4 accent-blue-900" /> Preview
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
                      {content.isPreview && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">Preview</span>}
                      <span className="text-[11px] font-semibold text-slate-400">#{content.order || 0}</span>
                    </div>
                    <h4 className="mt-1 font-bold text-slate-900">{content.title}</h4>
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
                      {deletingContentId === content._id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} Delete
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
function FormInput({ label, name, value, onChange, placeholder, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type}
        className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        {...props} />
    </label>
  );
}

function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-900">
        <BookOpen size={22} />
      </div>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">{text}</p>
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
