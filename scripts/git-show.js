import { execFileSync } from "node:child_process";

const file = "artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts";
process.chdir("/vercel/share/v0-project");

try {
  const log = execFileSync("git", ["log", "--oneline", "--all", "--", file], {
    encoding: "utf8",
  });
  console.log("=== git log ===");
  console.log(log);
} catch (e) {
  console.error("log failed:", e.message);
}

try {
  const show = execFileSync("git", ["show", `main:${file}`], {
    encoding: "utf8",
  });
  console.log("=== main version ===");
  console.log(show);
} catch (e) {
  console.error("show failed:", e.message);
}
