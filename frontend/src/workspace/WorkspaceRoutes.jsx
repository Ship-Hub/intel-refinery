import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateMethod from "./pages/CreateMethod";
import CreateSources from "./pages/CreateSources";
import RefinePage from "./pages/RefinePage";
import Complete from "./pages/Complete";
import Transform from "./pages/Transform";

export default function WorkspaceRoutes() {
  return (
    <Routes>
      {/* Routes WITH sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
      </Route>

      {/* Routes WITHOUT sidebar (full-page) */}
      <Route path="/create" element={<CreateMethod />} />
      <Route path="/create/sources" element={<CreateSources />} />
      <Route path="/projects/:id/refine" element={<RefinePage />} />
      <Route path="/projects/:id/complete" element={<Complete />} />
      <Route path="/projects/:id/transform" element={<Transform />} />
    </Routes>
  );
}
