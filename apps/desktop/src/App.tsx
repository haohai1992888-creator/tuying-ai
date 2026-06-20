import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getAccessToken, logout } from "./services/api";
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
import AnnouncementBar from "./components/AnnouncementBar";
import { BehaviorTracker } from "./components/BehaviorTracker";

function Nav() {
  useLocation(); // 路由变化时重新读取登录态
  const loggedIn = !!getAccessToken();
  return (
    <nav className="nav">
      <strong style={{ marginRight: "auto" }}>ACS Desktop</strong>
      <Link to="/">首页</Link>
      <Link to="/download">下载客户端</Link>
      {loggedIn ? (
        <>
          <Link to="/profile">个人中心</Link>
          <Link to="/points">积分</Link>
          <Link to="/recharge">充值</Link>
          <Link to="/membership">会员中心</Link>
          <Link to="/settings">高级设置</Link>
          <Link to="/orders">我的订单</Link>
          <Link to="/tasks">任务</Link>
          <Link to="/task">Workflow</Link>
          <Link to="/generate">GPT生成</Link>
          <Link to="/files">文件管理</Link>
          <Link to="/upload">上传中心</Link>
          <Link to="/scene-image">商品场景图</Link>
          <Link to="/poster">AI海报</Link>
          <Link to="/model-image">AI模特图</Link>
          <Link to="/batch">批量生成</Link>
          <Link to="/batch-engine">Batch Engine</Link>
          <Link to="/templates">模板中心</Link>
          <Link to="/detail-page">AI详情页</Link>
          <Link to="/video">AI视频</Link>
          <Link to="/data">我的数据</Link>
          <button className="btn" onClick={() => { logout(); window.location.href = "/login"; }}>
            退出
          </button>
        </>
      ) : (
        <>
          <Link to="/login">登录</Link>
          <Link to="/register">注册</Link>
        </>
      )}
    </nav>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <UpdateChecker>
      <>
        <AnnouncementBar />
        <BehaviorTracker />
        <Nav />
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
