import { NavLink } from "react-router-dom";
import {
  CreditCard,
  Database,
  FolderKanban,
  Home,
  Link2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import logoMark from "../../../assets/intel-refinery-icon-512.png";

const WORKSPACE = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/projects", icon: FolderKanban, label: "All projects" },
  { to: "/create", icon: Plus, label: "New project" },
];

const CYBER = [
  { to: "/cyber/projects", icon: ShieldCheck, label: "Cyber projects" },
  { to: "/cyber/projects/new", icon: Plus, label: "New Cyber project" },
];

const LIBRARY = [
  { to: "/sources", icon: Database, label: "Sources" },
  { to: "/trash", icon: Trash2, label: "Trash" },
];

const SETTINGS_LINKS = [
  { to: "/integrations", icon: Link2, label: "Integrations" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/billing", icon: CreditCard, label: "Billing" },
];

const getDisplayName = (user) =>
  user?.displayName ||
  user?.email ||
  "Intel Refinery user";

const getInitial = (user) =>
  getDisplayName(user).trim().charAt(0).toUpperCase() || "U";

function Item({ to, end, icon: Icon, label, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition ${
          collapsed ? "w-10 justify-center" : "w-full"
        } ${
          isActive
            ? "bg-elevated text-ink-2"
            : "text-ink-4 hover:bg-surface hover:text-ink-2"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan" : "text-ink-5"}`} />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

function Section({ title, items, collapsed, onNavigate }) {
  return (
    <section className="px-3">
      {!collapsed && (
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-5">
          {title}
        </div>
      )}
      <div className="grid gap-1">
        {items.map((item) => (
          <Item key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar({ collapsed, onToggle, user, onSignOut, mobileOpen = false, onMobileClose }) {
  const displayName = getDisplayName(user);
  const widthClass = collapsed ? "w-[68px]" : "w-[232px]";
  const mobileClass = mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <nav
        className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-line bg-rail py-5 transition-[width,transform] duration-200 md:relative ${widthClass} ${mobileClass}`}
      >
        <div className="mb-5 flex items-center gap-3 px-4">
          <img src={logoMark} alt="" className="h-9 w-9 shrink-0 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-ink-2">
                Intel <span className="text-cyan">Refinery</span>
              </div>
              <div className="text-[11px] text-ink-5">Turn chaos into understanding</div>
            </div>
          )}
        </div>

        <div className="grid gap-5 overflow-y-auto">
          <Section title="Workspace" items={WORKSPACE} collapsed={collapsed} onNavigate={onMobileClose} />
          <Section title="Cyber" items={CYBER} collapsed={collapsed} onNavigate={onMobileClose} />
          <Section title="Library" items={LIBRARY} collapsed={collapsed} onNavigate={onMobileClose} />
          <Section title="Settings" items={SETTINGS_LINKS} collapsed={collapsed} onNavigate={onMobileClose} />
        </div>

        <div className="min-h-4 flex-1" />

        <div className="grid gap-2 px-3">
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={`hidden h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-ink-4 transition hover:bg-surface hover:text-ink-2 md:flex ${
              collapsed ? "w-10 justify-center" : "w-full"
            }`}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>

          <div className={`flex items-center gap-3 rounded-lg border border-line px-3 py-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan/25 bg-cyan/[0.08] text-[12px] font-semibold text-cyan">
              {getInitial(user)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-ink-2">{displayName}</div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-5 transition hover:text-ink-2"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export function MobileNavButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-lg border border-line bg-rail text-ink-3 shadow-lg md:hidden"
      aria-label="Open navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
