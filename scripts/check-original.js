import { execSync } from "node:child_process";

const FILE = "artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts";

function sh(cmd) {
  return execSync(cmd, { cwd: "/vercel/share/v0-project", encoding: "utf8" });
}

console.log("=== Commits touching the file ===");
const log = sh(`git log --oneline -- ${FILE}`);
console.log(log);

const commits = log.trim().split("\n").map((l) => l.split(" ")[0]);
if (commits.length === 0) {
  console.log("No history");
  process.exit(0);
}

const first = commits[commits.length - 1];
console.log(`\n=== First version (${first}) ===`);
try {
  console.log(sh(`git show ${first}:${FILE}`));
} catch (e) {
  console.log("Could not read first version:", e.message);
}
