import { getAccessToken } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export interface TrackPayload {
  eventType: string;
  module: string;
  action: string;
  metadata?: Record<string, unknown>;
  cost?: number;
  revenue?: number;
  duration?: number;
}

/** Desktop Analytics SDK — 统一埋点 */
export class AnalyticsTracker {
  static track(event: TrackPayload): void {
    const token = getAccessToken();
    if (!token) return;

    void fetch(`${API_BASE}/api/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    }).catch(() => {});
  }
}
