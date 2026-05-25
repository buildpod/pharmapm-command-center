import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const cachePath = join(process.cwd(), ".next");

if (!existsSync(cachePath)) {
  console.log("No .next cache found.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const target = join(tmpdir(), `pharmapm-command-center-next-stale-${stamp}`);

renameSync(cachePath, target);
console.log(`Moved .next cache to ${target}`);
