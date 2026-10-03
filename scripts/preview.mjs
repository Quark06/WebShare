import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localNode = join(root, ".local/runtime/node_modules/node/bin/node.exe");
const node = existsSync(localNode) ? localNode : process.execPath;

if (!existsSync(join(root, "build/index.html"))) {
  throw new Error("Build the application first with npm run build.");
}

mkdirSync(join(root, ".local"), { recursive: true });
const child = spawn(node, ["server/server.ts"], {
  cwd: root,
  detached: true,
  windowsHide: true,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: [
    "ignore",
    openSync(join(root, ".local/preview.log"), "a"),
    openSync(join(root, ".local/preview-error.log"), "a"),
  ],
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.unref();
writeFileSync(join(root, ".local/preview.pid"), String(child.pid));
console.log(`Preview process started: ${child.pid}. Logs: .local/preview*.log`);
console.log("Open http://localhost:8080 after the server has started.");
