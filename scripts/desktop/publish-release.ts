import { access, copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { distributionService } from "../../packages/distribution/src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

async function findFile(dir: string, pattern: RegExp): Promise<string | null> {
  try {
    await access(dir);
  } catch {
    return null;
  }

  async function walk(current: string): Promise<string | null> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const nested = await walk(full);
        if (nested) return nested;
      } else if (pattern.test(entry.name)) {
        return full;
      }
    }
    return null;
  }

  return walk(dir);
}

async function copyIfExists(src: string, dest: string): Promise<boolean> {
  try {
    await access(src);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    const size = (await stat(dest)).size;
    console.log(`  + ${path.relative(root, dest)} (${size} bytes)`);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const version = arg("version", "1.0.0")!;
  const publishCdn = process.argv.includes("--cdn");

  console.log(`\n=== AI Commerce Desktop Release v${version} ===\n`);

  const winDir = path.join(root, "download", "windows");
  const macDir = path.join(root, "download", "mac");
  await mkdir(winDir, { recursive: true });
  await mkdir(macDir, { recursive: true });

  const nsisDir = path.join(root, "apps/desktop/src-tauri/target/release/bundle/nsis");
  const winSrc =
    (await findFile(nsisDir, /^AI-Commerce-Setup.*\.exe$/i)) ??
    (await findFile(nsisDir, /\.exe$/i));
  const macSrc =
    (await findFile(path.join(root, "apps/desktop/src-tauri/target"), /^AI-Commerce.*\.dmg$/i)) ??
    (await findFile(path.join(root, "apps/desktop/src-tauri/target"), /\.dmg$/i));

  if (winSrc) await copyIfExists(winSrc, path.join(winDir, "AI-Commerce-Setup.exe"));
  if (macSrc) await copyIfExists(macSrc, path.join(macDir, "AI-Commerce.dmg"));

  const payload = await distributionService.generateUpdateJson({ version });
  console.log(`\nupdate.json -> download/update/update.json (v${payload.version})`);

  if (publishCdn) {
    const { uploaded } = await distributionService.publishToCdn();
    console.log(`CDN uploaded: ${uploaded.join(", ") || "(none)"}`);
  }

  console.log("\nDone.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
