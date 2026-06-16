import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export function getInitials(email = "") {
  const local = email.split("@")[0] || "U";
  return (
    local
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export default function DashboardLayout({
  title,
  sidebarOpen,
  setSidebarOpen,
  mobileOpen,
  setMobileOpen,
  onLogout,
  navGroups,
  children,
  viewSiteHref = "/",
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        style={{
          width: sidebarOpen ? "260px" : "68px",
          minWidth: sidebarOpen ? "260px" : "68px",
          transition:
            "width 260ms cubic-bezier(0.4,0,0.2,1), min-width 260ms cubic-bezier(0.4,0,0.2,1)",
        }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 overflow-hidden",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 overflow-hidden min-w-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 font-black text-sm text-white">
              S
            </div>
            {sidebarOpen && (
              <span className="whitespace-nowrap font-extrabold tracking-tight text-slate-900">
                Upskil<span className="text-blue-600">io</span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2 py-3">
          {navGroups.map((group) => (
            <SidebarGroup key={group.title} group={group} open={sidebarOpen} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            className={[
              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold",
              "text-slate-500 transition hover:bg-red-50 hover:text-red-600",
              sidebarOpen ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <LogOut size={17} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-bold text-slate-900 truncate">{title}</h1>
          <Link
            to={viewSiteHref}
            className="ml-auto hidden sm:inline-flex h-9 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            View site
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
function SidebarGroup({ group, open }) {
  return (
    <div>
      {open && (
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {group.title}
        </p>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.id} item={item} open={open} depth={0} />
        ))}
      </div>
    </div>
  );
}

function SidebarItem({ item, open, depth }) {
  const Icon = item.icon;
  const paddingLeft = open ? `${12 + depth * 12}px` : undefined;

  const baseCls = [
    "flex w-full items-center gap-3 rounded-lg transition-all duration-150 text-left",
    open ? "h-10 px-3" : "h-10 justify-center px-0",
    item.active
      ? "bg-blue-50 text-blue-900 font-bold"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-semibold",
  ].join(" ");

  if (item.children?.length) {
    return (
      <div>
        <button
          type="button"
          onClick={item.onToggle}
          className={baseCls}
          style={{ paddingLeft: open ? paddingLeft : undefined }}
        >
          {Icon && <Icon size={17} className="shrink-0" />}
          {open && (
            <>
              <span className="flex-1 truncate text-sm font-semibold">
                {item.label}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform duration-200 ${item.expanded ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>
        {item.expanded && open && (
          <div className="mt-0.5 space-y-0.5 pl-1">
            {item.children.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                open={open}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.href) {
    return (
      <Link
        to={item.href}
        className={baseCls}
        style={{ paddingLeft: open ? paddingLeft : undefined }}
      >
        {Icon && <Icon size={17} className="shrink-0" />}
        {open && (
          <span className="truncate text-sm font-semibold">{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      className={baseCls}
      style={{ paddingLeft: open ? paddingLeft : undefined }}
    >
      {Icon && <Icon size={17} className="shrink-0" />}
      {open && (
        <span className="truncate text-sm font-semibold">{item.label}</span>
      )}
    </button>
  );
}
