export const CATEGORIES = [
  {
    id: "web",
    label: "Web Development",
    count: "120+ Courses",
    emoji: "💻",
    gradient: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    id: "ai",
    label: "Artificial Intelligence",
    count: "85+ Courses",
    emoji: "🤖",
    gradient: "from-violet-500 to-purple-700",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
  {
    id: "data",
    label: "Data Science",
    count: "95+ Courses",
    emoji: "📊",
    gradient: "from-emerald-500 to-teal-700",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    id: "design",
    label: "UI / UX Design",
    count: "60+ Courses",
    emoji: "🎨",
    gradient: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  {
    id: "mobile",
    label: "Mobile Development",
    count: "70+ Courses",
    emoji: "📱",
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    id: "devops",
    label: "DevOps & Cloud",
    count: "55+ Courses",
    emoji: "☁️",
    gradient: "from-sky-500 to-cyan-600",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
];

export function getCategoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}

export function matchCategory(courseCategory, filterId) {
  if (!filterId || filterId === "all") return true;
  const label = getCategoryLabel(filterId);
  const cat = (courseCategory || "").toLowerCase();
  return cat.includes(label.toLowerCase()) || cat.includes(filterId.toLowerCase());
}
