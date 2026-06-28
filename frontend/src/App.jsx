import React from "react";
import { BrowserRouter } from "react-router-dom";
import ConsoleApp from "./components/ConsoleApp";
import DocsPage from "./components/DocsPage";
import AuthCallback from "./components/AuthCallback";
import AuthPage from "./components/AuthPage";
import RefineryLanding from "./refinery/RefineryLanding";
import WorkspaceRoutes from "./workspace/WorkspaceRoutes";

export default function App() {
  // Workspace app: deployed to app.domainname.com, or ?app=1 on localhost
  const params = new URLSearchParams(window.location.search);
  const isWorkspace = window.location.hostname.startsWith("app.") || params.has("app");
  const path = window.location.pathname;

  if (path === "/auth/callback") return <AuthCallback />;

  if (isWorkspace) {
    return (
      <BrowserRouter>
        <WorkspaceRoutes />
      </BrowserRouter>
    );
  }

  // Main domain: legacy routing, then landing page
  if (path === "/login") return <AuthPage mode="login" />;
  if (path === "/signup") return <AuthPage mode="signup" />;
  if (path === "/console") return <ConsoleApp />;
  if (path === "/docs" || path === "/developer") return <DocsPage />;
  return <RefineryLanding />;
}
