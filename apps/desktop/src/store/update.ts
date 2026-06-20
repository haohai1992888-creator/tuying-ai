const CHANNEL_KEY = "acs_release_channel";
const SNOOZE_KEY = "acs_update_snooze_until";
const DEVICE_KEY = "acs_device_id";

export type ReleaseChannel = "STABLE" | "BETA";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getReleaseChannel(): ReleaseChannel {
  const v = localStorage.getItem(CHANNEL_KEY);
  if (v === "STABLE") return "STABLE";
  return "BETA";
}

export function setReleaseChannel(channel: ReleaseChannel): void {
  localStorage.setItem(CHANNEL_KEY, channel);
}

export function snoozeUpdate(hours = 24): void {
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + hours * 3600 * 1000));
}

export function isUpdateSnoozed(): boolean {
  const until = localStorage.getItem(SNOOZE_KEY);
  if (!until) return false;
  if (Date.now() > Number(until)) {
    localStorage.removeItem(SNOOZE_KEY);
    return false;
  }
  return true;
}

export function clearUpdateSnooze(): void {
  localStorage.removeItem(SNOOZE_KEY);
}
