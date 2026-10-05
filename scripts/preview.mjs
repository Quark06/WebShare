import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localNode = join(root, ".local/runtime/node_modules/node/bin/node.exe");
const node = existsSync(localNode) ? localNode : process.execPath;

if (!existsSync(join(root, "build/index.html"))) {
  throw new Error("Build the application first with npm run build.");
}

const logDirectory = join(root, ".local");
mkdirSync(logDirectory, { recursive: true });
const stdout = openSync(join(logDirectory, "preview.log"), "a");
const stderr = openSync(join(logDirectory, "preview-error.log"), "a");
const child = spawn(node, ["server/server.ts"], {
  cwd: root,
  windowsHide: true,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", stdout, stderr],
});
let interruptedExitCode;
for (const [signal, exitCode] of [["SIGINT", 130], ["SIGTERM", 143]]) {
  process.on(signal, () => {
    interruptedExitCode = exitCode;
    child.kill(signal);
  });
}
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  closeSync(stdout);
  closeSync(stderr);
  process.exitCode = interruptedExitCode ?? code ?? (signal === "SIGINT" ? 130 : 1);
});
console.log("Preview runs in this terminal. Press Ctrl+C to stop.");
console.log("Open http://localhost:8080 after the server has started.");
console.log("Server output: .local/preview.log and .local/preview-error.log");
