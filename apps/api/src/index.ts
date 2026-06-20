import express from "express";
import cors from "cors";
import path from "node:path";
import { loadEnv, initMonitoring, captureException, logger } from "@acs/ops";
import { createUser } from "./api/test";
import { register } from "./api/auth/register";
import { login } from "./api/auth/login";
import { me } from "./api/auth/me";
import { uploadImage } from "./api/file/upload";
import { getFiles } from "./api/file/list";
import { deleteFile } from "./api/file/delete";
import { serveStorage } from "./api/storage/serve";
import { create as createTaskRoute } from "./api/task/create";
import { run as runTaskRoute } from "./api/task/run";
import { detail as taskDetailRoute } from "./api/task/detail";
import { modelStats as modelStatsRoute } from "./api/analytics/model";
import { create as createBatchRoute } from "./api/batch/create";
import { detail as batchDetailRoute } from "./api/batch/detail";
import { run as runBatchRoute } from "./api/batch/run";
import { createOrder } from "./api/payment/create";
import { paymentCallback, mockPay } from "./api/payment/callback";
import { listPlans } from "./api/payment/plans";
import { balance as userBalanceRoute } from "./api/user/balance";
import { logs as userPointsRoute } from "./api/user/points";
import { list as templateListRoute } from "./api/template/list";
import { detail as templateDetailRoute } from "./api/template/detail";
import { hot as templateHotRoute } from "./api/template/hot";
import { recent as templateRecentRoute } from "./api/template/recent";
import { categories as templateCategoriesRoute } from "./api/template/categories";
import { addFavorite as templateFavoriteRoute, removeFavorite as templateUnfavoriteRoute } from "./api/template/favorite";
import { generate as templateGenerateRoute } from "./api/template/generate";
import { latest as versionLatestRoute } from "./api/version/latest";
import { downloadLog as versionDownloadLogRoute } from "./api/version/download-log";
import { tauriUpdate as tauriUpdateRoute } from "./api/version/tauri-update";
import { downloadInfo, updateJson as downloadUpdateJsonApi } from "./api/download/info";
import { registerDownloadStatic, downloadUpdateJson } from "./api/download/static";
import { categories as detailCategoriesRoute } from "./api/detail/categories";
import { templates as detailTemplatesRoute } from "./api/detail/templates";
import { extractSellingPoints as detailExtractRoute } from "./api/detail/extract-selling-points";
import { generate as detailGenerateRoute } from "./api/detail/generate";
import { generateFive as detailGenerateFiveRoute } from "./api/detail/generate-five";
import {
  getDetail as detailGetRoute,
  exportHtmlRoute as detailExportHtmlRoute,
  exportPsdRoute as detailExportPsdRoute,
  regenerateBlock as detailRegenerateRoute,
} from "./api/detail/detail";
import { auth } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { registerAdminRoutes } from "./routes/admin";
import { globalRateLimiter, requestLogger, apiSignature } from "./middleware/production";
import { isMemoryQueueEnabled, registerMemoryHandler } from "@acs/queue";
import { health as healthRoute } from "./api/health";
import {
  redeemInvite,
  submitFeedback,
  reportIssue,
  trackBehavior,
  listActiveAnnouncements,
} from "./api/beta/public";
import { executeTask } from "./services/taskRunner";

loadEnv(path.resolve(__dirname, "../../.."));

if (isMemoryQueueEnabled()) {
  registerMemoryHandler(async (taskId) => {
    await executeTask(taskId);
  });
  logger.info("Memory queue handler registered in API process");
}

const app = express();

void initMonitoring();

app.get("/api/health", healthRoute);

app.use(
  cors({
    origin: ["http://localhost:3002", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(globalRateLimiter);
app.use(apiSignature);

registerDownloadStatic(app);

app.get("/", (_req, res) => {
  res.json({ message: "AI Commerce Studio API Running" });
});

app.get("/test", createUser);

app.post("/api/register", register);
app.post("/api/login", login);
app.get("/api/me", auth, me);

app.post("/api/file/upload", auth, upload.single("file"), uploadImage);
app.get("/api/file/list", auth, getFiles);
app.delete("/api/file/:id", auth, deleteFile);

app.use("/api/storage", serveStorage);

app.post("/api/task/create", auth, createTaskRoute);
app.post("/api/task/run/:id", auth, runTaskRoute);
app.get("/api/task/:id", auth, taskDetailRoute);
app.get("/api/analytics/models", auth, modelStatsRoute);

app.post("/api/batch/create", auth, createBatchRoute);
app.get("/api/batch/:id", auth, batchDetailRoute);
app.post("/api/batch/run/:id", auth, runBatchRoute);

app.get("/api/payment/plans", auth, listPlans);
app.get("/api/payment/packages", auth, listPlans);
app.post("/api/payment/create", auth, createOrder);
app.post("/api/payment/callback", paymentCallback);
app.post("/api/payment/callback/wechat", paymentCallback);
app.post("/api/payment/callback/alipay", paymentCallback);
app.get("/api/payment/mock-pay", mockPay);
app.post("/api/payment/mock-pay", mockPay);

app.get("/api/user/balance", auth, userBalanceRoute);
app.get("/api/user/points", auth, userPointsRoute);
app.get("/api/points", auth, userBalanceRoute);
app.get("/api/points/logs", auth, userPointsRoute);

app.get("/api/template/list", auth, templateListRoute);
app.get("/api/template/hot", auth, templateHotRoute);
app.get("/api/template/categories", auth, templateCategoriesRoute);
app.get("/api/template/recent", auth, templateRecentRoute);
app.get("/api/template/:id", auth, templateDetailRoute);
app.post("/api/template/favorite", auth, templateFavoriteRoute);
app.post("/api/template/generate", auth, templateGenerateRoute);

app.get("/api/templates", auth, templateListRoute);
app.get("/api/templates/hot", auth, templateHotRoute);
app.get("/api/templates/recent", auth, templateRecentRoute);
app.get("/api/templates/categories", auth, templateCategoriesRoute);
app.get("/api/templates/:id", auth, templateDetailRoute);
app.post("/api/templates/:id/favorite", auth, templateFavoriteRoute);
app.delete("/api/templates/:id/favorite", auth, templateUnfavoriteRoute);
app.post("/api/templates/:id/generate", auth, templateGenerateRoute);

app.get("/api/version/latest", versionLatestRoute);
app.post("/api/version/download-log", versionDownloadLogRoute);
app.get("/update/:target/:currentVersion", tauriUpdateRoute);

app.get("/api/download/info", downloadInfo);
app.get("/api/download/update.json", downloadUpdateJsonApi);
app.get("/update.json", downloadUpdateJson);

app.get("/api/detail/categories", auth, detailCategoriesRoute);
app.get("/api/detail/templates", auth, detailTemplatesRoute);
app.post("/api/detail/extract-selling-points", auth, detailExtractRoute);
app.post("/api/detail/generate-five", auth, detailGenerateFiveRoute);
app.post("/api/detail/generate", auth, detailGenerateRoute);
app.get("/api/detail/:id/export/html", auth, detailExportHtmlRoute);
app.get("/api/detail/:id/export/psd", auth, detailExportPsdRoute);
app.get("/api/detail/:id", auth, detailGetRoute);
app.post("/api/detail/:id/blocks/:blockId/regenerate", auth, detailRegenerateRoute);

app.post("/api/beta/invite/redeem", auth, redeemInvite);
app.post("/api/beta/feedback", auth, submitFeedback);
app.post("/api/beta/issue-report", auth, reportIssue);
app.post("/api/beta/behavior", auth, trackBehavior);
app.get("/api/beta/announcements", listActiveAnnouncements);

registerAdminRoutes(app);

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  captureException(reason);
});

process.on("uncaughtException", (error) => {
  captureException(error);
});
