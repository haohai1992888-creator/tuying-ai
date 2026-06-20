import type { Express } from "express";
import { admin } from "../middleware/admin";
import { adminLogin } from "../api/auth/adminLogin";
import { dashboard } from "../api/admin/dashboard";
import { getAlerts, resolveAlertHandler } from "../api/admin/alerts";
import { listUsers } from "../api/admin/users";
import { getUser, patchUser } from "../api/admin/userDetail";
import { listFiles } from "../api/admin/files";
import { listVideoTasks } from "../api/admin/videoTasks";
import {
  listMemberships,
  extendMembership,
  grantMembership,
  cancelMembership,
  membershipStats,
} from "../api/admin/memberships";
import {
  listVersions,
  createVersion,
  versionStats,
  publishVersion,
} from "../api/admin/versions";
import { listTasks, listAiTasks } from "../api/admin/tasks";
import {
  listWorkflowRuns,
  retryWorkflowRun,
  listWorkflows,
} from "../api/admin/workflows";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  templateStats,
} from "../api/admin/templates";
import { listPackages, createPackage, updatePackage } from "../api/admin/packages";
import { getModelUsage } from "../api/admin/modelUsage";
import { listBatchTasks } from "../api/admin/batchTasks";
import { listPointLogs } from "../api/admin/pointsLogs";
import { listOrders } from "../api/admin/orders";
import { getAnalytics } from "../api/admin/analytics";
import {
  listBetaUsers,
  addBetaUser,
  removeBetaUser,
  extendBetaUser,
  giftBetaPoints,
  getBetaDashboard,
  getBetaReport,
} from "../api/admin/betaUsers";
import { listInviteCodes, createInviteCode, deleteInviteCode } from "../api/admin/inviteCodes";
import { listFeedback, replyFeedback, closeFeedback } from "../api/admin/feedback";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../api/admin/announcements";
import { getCostCenter, getBehaviorStats } from "../api/admin/costCenter";

export function registerAdminRoutes(app: Express): void {
  app.post("/api/auth/login", adminLogin);

  app.get("/api/admin/dashboard", admin, dashboard);
  app.get("/api/admin/alerts", admin, getAlerts);
  app.post("/api/admin/alerts", admin, resolveAlertHandler);

  app.get("/api/admin/users", admin, listUsers);
  app.get("/api/admin/users/:id", admin, getUser);
  app.patch("/api/admin/users/:id", admin, patchUser);

  app.get("/api/admin/files", admin, listFiles);
  app.get("/api/admin/video-tasks", admin, listVideoTasks);

  app.get("/api/admin/memberships", admin, listMemberships);
  app.post("/api/admin/memberships/:userId/extend", admin, extendMembership);
  app.post("/api/admin/memberships/:userId/grant", admin, grantMembership);
  app.post("/api/admin/memberships/:userId/cancel", admin, cancelMembership);
  app.get("/api/admin/membership/stats", admin, membershipStats);

  app.get("/api/admin/versions", admin, listVersions);
  app.post("/api/admin/versions", admin, createVersion);
  app.get("/api/admin/versions/stats", admin, versionStats);
  app.post("/api/admin/versions/:id/publish", admin, publishVersion);

  app.get("/api/admin/tasks", admin, listTasks);
  app.get("/api/admin/ai-tasks", admin, listAiTasks);
  app.get("/api/admin/batch-tasks", admin, listBatchTasks);

  app.get("/api/admin/workflow-runs", admin, listWorkflowRuns);
  app.post("/api/admin/workflow-runs/:id/retry", admin, retryWorkflowRun);
  app.get("/api/admin/workflows", admin, listWorkflows);

  app.get("/api/admin/templates", admin, listTemplates);
  app.post("/api/admin/templates", admin, createTemplate);
  app.put("/api/admin/templates/:id", admin, updateTemplate);
  app.get("/api/admin/templates/stats", admin, templateStats);

  app.get("/api/admin/packages", admin, listPackages);
  app.post("/api/admin/packages", admin, createPackage);
  app.put("/api/admin/packages/:id", admin, updatePackage);

  app.get("/api/admin/model-usage", admin, getModelUsage);
  app.get("/api/admin/points/logs", admin, listPointLogs);
  app.get("/api/admin/orders", admin, listOrders);
  app.get("/api/admin/analytics", admin, getAnalytics);

  app.get("/api/admin/beta/users", admin, listBetaUsers);
  app.post("/api/admin/beta/users", admin, addBetaUser);
  app.delete("/api/admin/beta/users/:userId", admin, removeBetaUser);
  app.post("/api/admin/beta/users/:userId/extend", admin, extendBetaUser);
  app.post("/api/admin/beta/users/:userId/gift", admin, giftBetaPoints);
  app.get("/api/admin/beta/dashboard", admin, getBetaDashboard);
  app.get("/api/admin/beta/report", admin, getBetaReport);

  app.get("/api/admin/beta/invite-codes", admin, listInviteCodes);
  app.post("/api/admin/beta/invite-codes", admin, createInviteCode);
  app.delete("/api/admin/beta/invite-codes/:id", admin, deleteInviteCode);

  app.get("/api/admin/beta/feedback", admin, listFeedback);
  app.post("/api/admin/beta/feedback/:id/reply", admin, replyFeedback);
  app.post("/api/admin/beta/feedback/:id/close", admin, closeFeedback);

  app.get("/api/admin/beta/announcements", admin, listAnnouncements);
  app.post("/api/admin/beta/announcements", admin, createAnnouncement);
  app.patch("/api/admin/beta/announcements/:id", admin, updateAnnouncement);
  app.delete("/api/admin/beta/announcements/:id", admin, deleteAnnouncement);

  app.get("/api/admin/beta/cost-center", admin, getCostCenter);
  app.get("/api/admin/beta/behavior", admin, getBehaviorStats);
}
