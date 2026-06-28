import { Navigate, Routes, Route } from "react-router-dom";
import AuthPage from "../components/AuthPage";
import AppLayout from "./layout/AppLayout";
import { WorkspaceAuthGate } from "./auth/WorkspaceAuth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateMethod from "./pages/CreateMethod";
import CreateSources from "./pages/CreateSources";
import CreateCyberProject from "./pages/CreateCyberProject";
import CyberProjectWorkspace from "./pages/CyberProjectWorkspace";
import CyberProjectOverview from "./pages/CyberProjectOverview";
import CyberRefinementRun from "./pages/CyberRefinementRun";
import RefinePage from "./pages/RefinePage";
import ProjectOverview from "./pages/ProjectOverview";
import Complete from "./pages/Complete";
import Transform from "./pages/Transform";
import UtilityPage from "./pages/UtilityPage";

export default function WorkspaceRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      <Route element={<WorkspaceAuthGate />}>
        {/* Routes WITH sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/cyber/projects" element={<Projects profileFilter="cyber" />} />
          <Route path="/cyber/projects/:id/workspace" element={<CyberProjectWorkspace />} />
          <Route path="/cyber/projects/:id/overview" element={<CyberProjectOverview />} />
          <Route path="/cyber/projects/:id/refine" element={<CyberRefinementRun />} />
          <Route path="/sources" element={<UtilityPage type="sources" />} />
          <Route path="/trash" element={<UtilityPage type="trash" />} />
          <Route path="/integrations" element={<UtilityPage type="integrations" />} />
          <Route path="/settings" element={<UtilityPage type="settings" />} />
          <Route path="/billing" element={<UtilityPage type="billing" />} />
        </Route>

        {/* Routes WITHOUT sidebar (full-page) */}
        <Route path="/create" element={<CreateMethod />} />
        <Route path="/create/sources" element={<CreateSources />} />
        <Route path="/cyber/projects/new" element={<CreateCyberProject />} />
        <Route path="/projects/:id/overview" element={<ProjectOverview />} />
        <Route path="/projects/:id/refine" element={<RefinePage />} />
        <Route path="/projects/:id/complete" element={<Complete />} />
        <Route path="/projects/:id/transform" element={<Transform />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
