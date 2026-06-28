import React from "react";
import { BrowserRouter } from "react-router-dom";
import ConsoleApp from "./components/ConsoleApp";
import DocsPage from "./components/DocsPage";
import RefineryLanding from "./refinery/RefineryLanding";
import WorkspaceRoutes from "./workspace/WorkspaceRoutes";

export default function App() {
  // Workspace app: deployed to app.domainname.com, or ?app=1 on localhost
  const params = new URLSearchParams(window.location.search);
  const isWorkspace = window.location.hostname.startsWith("app.") || params.has("app");

  if (isWorkspace) {
    return (
      <BrowserRouter>
        <WorkspaceRoutes />
      </BrowserRouter>
    );
  }

  // Main domain: legacy routing, then landing page
  const path = window.location.pathname;
  if (path === "/console") return <ConsoleApp />;
  if (path === "/docs" || path === "/developer") return <DocsPage />;
  return <RefineryLanding />;
}
