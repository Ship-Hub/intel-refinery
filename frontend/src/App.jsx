import React from "react";
import { BrowserRouter } from "react-router-dom";
import ConsoleApp from "./components/ConsoleApp";
import DocsPage from "./components/DocsPage";
import AuthCallback from "./components/AuthCallback";
import AuthPage from "./components/AuthPage";
import RefineryLanding from "./refinery/RefineryLanding";
import WorkspaceRoutes from "./workspace/WorkspaceRoutes";

const getWorkspaceBaseUrl = () => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `${window.location.origin}?app=1`;
  }

  return "https://app.intelrefinery.site";
};

function MainDomainAuthRedirect({ mode }) {
  React.useEffect(() => {
    const target = new URL(`${getWorkspaceBaseUrl()}/${mode}`);
    window.location.replace(target.toString());
  }, [mode]);

  return null;
}

export default function App() {
  // Workspace app: deployed to app.domainname.com, or ?app=1 on localhost
  const params = new URLSearchParams(window.location.search);
  const isWorkspace = window.location.hostname.startsWith("app.") || params.has("app");
  const path = window.location.pathname;

  if (path === "/auth/callback") return <AuthCallback />;
  if (path === "/login" || path === "/signup") {
    if (!isWorkspace && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return <MainDomainAuthRedirect mode={path.slice(1)} />;
    }

    return <AuthPage mode={path === "/signup" ? "signup" : "login"} />;
  }

  if (isWorkspace) {
    return (
      <BrowserRouter>
        <WorkspaceRoutes />
      </BrowserRouter>
    );
  }

  // Main domain: legacy routing, then landing page
  if (path === "/console") return <ConsoleApp />;
  if (path === "/docs" || path === "/developer") return <DocsPage />;
  return <RefineryLanding />;
}
