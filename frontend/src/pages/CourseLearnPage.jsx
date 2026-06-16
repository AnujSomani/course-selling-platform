import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  Video,
} from "lucide-react";
import API from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const contentIcon = {
  video: Video,
  pdf: FileText,
  link: ExternalLink,
  text: FileText,
};

function CourseLearnPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const lessonParam = searchParams.get("lesson");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [activeId, setActiveId] = useState(lessonParam || "");
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);

  const activeContent = useMemo(
    () => contents.find((c) => c._id === activeId) || contents[0],
    [contents, activeId]
  );

  const activeIndex = contents.findIndex((c) => c._id === activeContent?._id);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const [previewRes, contentRes] = await Promise.all([
          API.get("/course/preview"),
          API.get(`/user/courses/${courseId}/content`),
        ]);
        const found = (previewRes.data.courses || []).find((c) => c._id === courseId);
        const list = contentRes.data.contents || [];
        if (!ignore) {
          setCourse(found || null);
          setContents(list);
          const initial = lessonParam || list[0]?._id || "";
          setActiveId(initial);
        }
      } catch (err) {
        if (!ignore) {
          toast.error(err.response?.data?.message || "Could not load course.");
          navigate("/dashboard?section=purchases");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [courseId, lessonParam, navigate]);

  useEffect(() => {
    let ignore = false;
    async function loadStream() {
      if (!activeContent) {
        setStreamUrl("");
        return;
      }
      if (activeContent.type === "text") {
        setStreamUrl("");
        return;
      }
      if (activeContent.type === "link") {
        setStreamUrl(activeContent.url);
        return;
      }
      try {
        setLoadingStream(true);
        const res = await API.get(`/stream/url/${activeContent._id}`);
        if (!ignore) setStreamUrl(res.data.streamUrl || "");
      } catch {
        if (!ignore) {
          setStreamUrl("");
          toast.error("Could not load media. Try again later.");
        }
      } finally {
        if (!ignore) setLoadingStream(false);
      }
    }
    loadStream();
    return () => {
      ignore = true;
    };
  }, [activeContent]);

  function selectLesson(id) {
    setActiveId(id);
    navigate(`/dashboard/learn/${courseId}?lesson=${id}`, { replace: true });
  }

  function goPrev() {
    if (activeIndex > 0) selectLesson(contents[activeIndex - 1]._id);
  }

  function goNext() {
    if (activeIndex < contents.length - 1) selectLesson(contents[activeIndex + 1]._id);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const navGroups = [
    {
      title: "Course",
      items: contents.map((item, idx) => {
        const Icon = contentIcon[item.type] || FileText;
        return {
          id: item._id,
          label: `${idx + 1}. ${item.title}`,
          icon: Icon,
          active: activeContent?._id === item._id,
          onClick: () => selectLesson(item._id),
        };
      }),
    },
    {
      title: "Navigation",
      items: [
        {
          id: "back",
          label: "Back to Purchases",
          icon: ArrowLeft,
          href: `/dashboard?section=purchases&course=${courseId}`,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-900" size={36} />
      </div>
    );
  }

  return (
    <DashboardLayout
      title={course?.title || "Course Player"}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      onLogout={handleLogout}
      navGroups={navGroups}
    >
      <div className="space-y-4">
        <Link
          to={`/dashboard?section=purchases&course=${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-900 transition"
        >
          <ArrowLeft size={16} /> Back to purchases
        </Link>

        {contents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <PlayCircle className="mx-auto text-slate-300" size={48} />
            <p className="mt-4 font-semibold text-slate-600">No lessons available yet.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-800">
                  Lesson {activeIndex + 1} of {contents.length}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  {activeContent?.title}
                </h2>
              </div>

              <div className="p-6">
                {loadingStream ? (
                  <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100">
                    <Loader2 className="animate-spin text-blue-900" size={32} />
                  </div>
                ) : activeContent?.type === "video" && streamUrl ? (
                  <video
                    key={streamUrl}
                    src={streamUrl}
                    controls
                    className="w-full rounded-xl bg-black max-h-[480px]"
                  />
                ) : activeContent?.type === "pdf" && streamUrl ? (
                  <iframe
                    title={activeContent.title}
                    src={streamUrl}
                    className="w-full h-[480px] rounded-xl border border-slate-200"
                  />
                ) : activeContent?.type === "link" && streamUrl ? (
                  <a
                    href={streamUrl.startsWith("http") ? streamUrl : `https://${streamUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    <ExternalLink size={16} /> Open resource
                  </a>
                ) : activeContent?.type === "text" ? (
                  <div className="prose prose-slate max-w-none rounded-xl bg-slate-50 p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeContent.text}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                    Content unavailable. Contact support if this persists.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex <= 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex >= contents.length - 1}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-40 cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CourseLearnPage;
