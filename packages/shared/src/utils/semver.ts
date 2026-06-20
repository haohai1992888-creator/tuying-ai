/** Semver 比较 — 返回 1 if a>b, -1 if a<b, 0 if equal */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

function parseVersion(v: string): [number, number, number] {
  const parts = v.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** 版本递增规则：patch +0.0.1 / minor +0.1.0 / major +1.0.0 */
export function bumpVersion(current: string, type: "patch" | "minor" | "major"): string {
  const [major, minor, patch] = parseVersion(current);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}
