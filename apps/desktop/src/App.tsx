import { Navigate, Route, Routes } from "react-router-dom";
import { getAccessToken } from "./services/api";
import HomePage from "./pages/HomePage";
import DownloadPage from "./pages/DownloadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PointsPage from "./pages/PointsPage";
import TasksPage from "./pages/TasksPage";
import TaskPage from "./pages/TaskPage";
import GeneratePage from "./pages/GeneratePage";
import FilesPage from "./pages/FilesPage";
import UploadPage from "./pages/UploadPage";
import SceneImagePage from "./pages/SceneImagePage";
import PosterPage from "./pages/PosterPage";
import ModelImagePage from "./pages/ModelImagePage";
import SettingsPage from "./pages/SettingsPage";
import RechargePage from "./pages/RechargePage";
import MyOrdersPage from "./pages/MyOrdersPage";
import BatchPage from "./pages/BatchPage";
import BatchEnginePage from "./pages/BatchEnginePage";
import MembershipPage from "./pages/MembershipPage";
import MembershipComparePage from "./pages/MembershipComparePage";
import TemplatesPage from "./pages/TemplatesPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import DetailPage from "./pages/DetailPage";
import VideoPage from "./pages/VideoPage";
import DataPage from "./pages/DataPage";
import { UpdateChecker } from "./components/UpdateChecker";
import { BehaviorTracker } from "./components/BehaviorTracker";
import { AppShell } from "./components/layout/AppShell";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="container">{children}</div>;
}

export default function App() {
  return (
    <UpdateChecker>
      <>
        <BehaviorTracker />
        <Routes>
          <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />
          <Route path="/register" element={<PublicShell><RegisterPage /></PublicShell>} />
          <Route path="/download" element={<PublicShell><DownloadPage /></PublicShell>} />

          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/points" element={<PrivateRoute><PointsPage /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
          <Route path="/task" element={<PrivateRoute><TaskPage /></PrivateRoute>} />
          <Route path="/generate" element={<PrivateRoute><GeneratePage /></PrivateRoute>} />
          <Route path="/files" element={<PrivateRoute><FilesPage /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="/scene-image" element={<PrivateRoute><SceneImagePage /></PrivateRoute>} />
          <Route path="/poster" element={<PrivateRoute><PosterPage /></PrivateRoute>} />
          <Route path="/model-image" element={<PrivateRoute><ModelImagePage /></PrivateRoute>} />
          <Route path="/recharge" element={<PrivateRoute><RechargePage /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><MyOrdersPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/batch" element={<PrivateRoute><BatchPage /></PrivateRoute>} />
          <Route path="/batch-engine" element={<PrivateRoute><BatchEnginePage /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><TemplatesPage /></PrivateRoute>} />
          <Route path="/templates/:id" element={<PrivateRoute><TemplateDetailPage /></PrivateRoute>} />
          <Route path="/detail-page" element={<PrivateRoute><DetailPage /></PrivateRoute>} />
          <Route path="/video" element={<PrivateRoute><VideoPage /></PrivateRoute>} />
          <Route path="/data" element={<PrivateRoute><DataPage /></PrivateRoute>} />
          <Route path="/membership" element={<PrivateRoute><MembershipPage /></PrivateRoute>} />
          <Route path="/membership/compare" element={<PrivateRoute><MembershipComparePage /></PrivateRoute>} />
        </Routes>
      </>
    </UpdateChecker>
  );
}
