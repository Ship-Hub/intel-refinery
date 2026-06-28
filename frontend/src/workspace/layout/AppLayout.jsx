import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useWorkspaceAuth } from "../auth/WorkspaceAuth";
import Sidebar, { MobileNavButton } from "../components/layout/Sidebar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } =
    useWorkspaceAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <MobileNavButton onClick={() => setMobileOpen(true)} />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={user}
        onSignOut={signOut}
      />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
