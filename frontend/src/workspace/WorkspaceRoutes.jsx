import { Navigate, Routes, Route } from "react-router-dom";
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
import Complete from "./pages/Complete";
import Transform from "./pages/Transform";

export default function WorkspaceRoutes() {
  return (
    <Routes>
      <Route element={<WorkspaceAuthGate />}>
        {/* Routes WITH sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/cyber/projects/:id/workspace" element={<CyberProjectWorkspace />} />
          <Route path="/cyber/projects/:id/overview" element={<CyberProjectOverview />} />
          <Route path="/cyber/projects/:id/refine" element={<CyberRefinementRun />} />
        </Route>

        {/* Routes WITHOUT sidebar (full-page) */}
        <Route path="/create" element={<CreateMethod />} />
        <Route path="/create/sources" element={<CreateSources />} />
        <Route path="/cyber/projects/new" element={<CreateCyberProject />} />
        <Route path="/projects/:id/refine" element={<RefinePage />} />
        <Route path="/projects/:id/complete" element={<Complete />} />
        <Route path="/projects/:id/transform" element={<Transform />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
