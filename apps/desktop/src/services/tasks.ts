import { apiFetch, type ApiResponse } from "./api";
import { getPreferredProvider } from "../store/settings";

export async function createAiTask<T>(
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiFetch<T>("/api/tasks/create", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      preferredProvider: body.preferredProvider ?? getPreferredProvider(),
    }),
  });
}
