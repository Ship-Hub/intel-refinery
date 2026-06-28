import { NavLink } from "react-router-dom";
import logoMark from "../../../assets/intel-refinery-icon-512.png";

const ICONS = {
  home: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 5.5L7 1l6 4.5V13H9V9H5v4H1V5.5Z" stroke={a} strokeWidth="1.1" strokeLinejoin="round" /></svg>),
  projects: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none">{[[1,1],[8,1],[1,8],[8,8]].map(([x,y],i)=><rect key={i} x={x} y={y} width="5" height="5" rx="1" stroke={a} strokeWidth="1.1"/>)}</svg>),
  sources: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1" stroke={a} strokeWidth="1.1"/><rect x="3" y="1.5" width="8" height="2" rx="0.5" stroke={a} strokeWidth="1"/></svg>),
  trash: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5h9l-1 9h-7l-1-9Z" stroke={a} strokeWidth="1.1"/><path d="M5 3.5v-1a2 2 0 0 1 4 0v1" stroke={a} strokeWidth="1.1"/></svg>),
  integrations: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke={a} strokeWidth="1.1"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" stroke={a} strokeWidth="1"/></svg>),
  settings: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={a} strokeWidth="1.1"/><path d="M4.5 7h5M4.5 5h5M4.5 9h3" stroke={a} strokeWidth="1" strokeLinecap="round"/></svg>),
  billing: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3.5" width="12" height="8" rx="1.5" stroke={a} strokeWidth="1.1"/><path d="M4.5 3.5v-1a1.5 1.5 0 0 1 3 0v1" stroke={a} strokeWidth="1.1"/></svg>),
  cyber: (a) => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l5 2.2v3.4c0 3-2 4.8-5 5.4-3-.6-5-2.4-5-5.4V3.7l5-2.2Z" stroke={a} strokeWidth="1.1" strokeLinejoin="round"/><path d="M4.5 7.1l1.6 1.6 3.4-3.5" stroke={a} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

const WORKSPACE = [
  { to: "/", key: "home", label: "Home", end: true },
  { to: "/projects", key: "projects", label: "Projects" },
  { to: "/cyber/projects/new", key: "cyber", label: "Cyber Refinery" },
  { to: "/sources", key: "sources", label: "Sources" },
  { to: "/trash", key: "trash", label: "Trash" },
];
const SETTINGS = [
  { to: "/integrations", key: "integrations", label: "Integrations" },
  { to: "/settings", key: "settings", label: "Settings" },
  { to: "/billing", key: "billing", label: "Billing" },
];

function Item({ to, end, icon, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-[9px] self-start rounded-[7px] px-[10px] py-2 cursor-pointer ${
          isActive ? "bg-elevated" : "hover:bg-surface"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="shrink-0 flex">{ICONS[icon](isActive ? "#57D8FF" : "#4B5563")}</span>
          <span className={`text-[13px] shrink-0 ${isActive ? "text-ink-2 font-medium" : "text-[#4B5563]"}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

const getDisplayName = (user) =>
  user?.displayName ||
  user?.email ||
  "Intel Refinery user";

const getInitial = (user) =>
  getDisplayName(user).trim().charAt(0).toUpperCase() || "U";

export default function Sidebar({ collapsed, onToggle, user, onSignOut }) {
  const displayName =
    getDisplayName(user);

  return (
    <nav
      data-collapsed={collapsed ? "1" : "0"}
      className="group/nav flex flex-col shrink-0 h-screen overflow-hidden whitespace-nowrap border-r border-line bg-rail py-6
                 [&[data-collapsed='1']_.rf-lbl]:opacity-0 [&_.rf-lbl]:transition-opacity [&_.rf-lbl]:duration-150"
      style={{ width: collapsed ? 68 : 214, minWidth: collapsed ? 68 : 214, transition: "width .34s cubic-bezier(.4,0,.2,1), min-width .34s cubic-bezier(.4,0,.2,1)" }}
    >
      {/* Logo */}
      <div className="px-[18px] pb-5">
        <div className="mb-[5px] flex items-center gap-[9px]">
          <img
            src={logoMark}
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="rf-lbl text-[12px] font-semibold tracking-[0.14em] text-ink-2">INTEL REFINERY</span>
        </div>
        <p className="rf-lbl m-0 pl-[37px] text-[10.5px] leading-snug text-ink-5">Turn information<br/>into understanding</p>
      </div>

      {/* Workspace */}
      <div className="mb-1.5 px-[10px]">
        <span className="rf-lbl mb-1.5 block px-2 text-[9.5px] font-medium tracking-[0.1em] text-ink-5">WORKSPACE</span>
        <div className="flex flex-col items-start gap-px">{WORKSPACE.map((i) => <Item key={i.key} {...i} icon={i.key} />)}</div>
      </div>

      {/* Settings */}
      <div className="mt-2.5 px-[10px]">
        <span className="rf-lbl mb-1.5 block px-2 text-[9.5px] font-medium tracking-[0.1em] text-ink-5">SETTINGS</span>
        <div className="flex flex-col items-start gap-px">{SETTINGS.map((i) => <Item key={i.key} {...i} icon={i.key} />)}</div>
      </div>

      <div className="flex-1 min-h-[14px]" />

      {/* Collapse toggle */}
      <div className="px-[10px] pb-2">
        <button onClick={onToggle} className="flex items-center gap-[11px] rounded-[7px] px-[11px] py-2 hover:bg-surface">
          <svg className="shrink-0 transition-transform duration-300" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
               width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 3L5 7l3.5 4M12 3L8.5 7l3.5 4" stroke="#4B5563" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="rf-lbl shrink-0 text-[12px] text-[#4B5563]">Collapse</span>
        </button>
      </div>

      {/* User */}
      <div className="px-[10px]">
        <div className="flex items-center gap-[9px] rounded-lg border border-line px-[10px] py-[9px]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan/25 bg-gradient-to-br from-cyan/15 to-gold/10 text-[11px] font-semibold text-cyan">
            {getInitial(user)}
          </div>
          <div className="rf-lbl min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-ink-2">{displayName}</div>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-0.5 text-[10.5px] text-[#4B5563] hover:text-ink-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
