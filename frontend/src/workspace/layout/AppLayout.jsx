import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useWorkspaceAuth } from "../auth/WorkspaceAuth";
import Sidebar from "../components/layout/Sidebar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } =
    useWorkspaceAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        user={user}
        onSignOut={signOut}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
