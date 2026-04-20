import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"

const files = [
  "artifacts/mockup-studio/src/components/devices3d/useScreenTexture.ts",
  "artifacts/mockup-studio/src/components/devices3d/GLBDeviceModel.tsx",
]

// Find git binary
const candidates = ["/usr/bin/git", "/usr/local/bin/git", "/bin/git"]
const git = candidates.find((p) => existsSync(p))
if (!git) {
  console.log("git not found; candidates checked:", candidates)
  process.exit(0)
}

for (const f of files) {
  console.log(`\n===== main:${f} =====`)
  const r = spawnSync(git, ["show", `main:${f}`], {
    cwd: "/vercel/share/v0-project",
    encoding: "utf8",
  })
  if (r.error) {
    console.log("error:", r.error.message)
    continue
  }
  if (r.status !== 0) {
    console.log("non-zero exit:", r.status, r.stderr)
    continue
  }
  // Grep for the relevant parts we care about
  const content = r.stdout
  if (f.endsWith("useScreenTexture.ts")) {
    console.log(content)
  } else {
    // Just show the markScreenByName / normalizeScreenUVs / texture application
    const lines = content.split("\n")
    let inRelevant = false
    let start = -1
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (
        /function (markScreenByName|normalizeScreenUVs|ensureScreenTexture)/.test(l) ||
        /screenFacesBack/.test(l) ||
        /flipY/.test(l) ||
        /\.map = screenTexture/.test(l) ||
        /material\.map = /.test(l)
      ) {
        console.log(`[L${i + 1}] ${l}`)
      }
    }
  }
}
