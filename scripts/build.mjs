import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localNode = join(root, ".local/runtime/node_modules/node/bin/node.exe");
const node = existsSync(localNode) ? localNode : process.execPath;
const version = spawnSync(node, ["--version"], { encoding: "utf8" });
if (version.error) throw version.error;
if (version.status !== 0) process.exit(version.status ?? 1);
if (Number(version.stdout.trim().replace(/^v/, "").split(".")[0]) < 24) {
  console.error("WebShare builds require Node.js 24 or newer.");
  process.exit(1);
}

const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this script with npm run build.");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "PATH";
const env = {
  ...process.env,
  [pathKey]: dirname(node) + delimiter + (process.env[pathKey] || ""),
};
console.log(`Building with Node.js ${version.stdout.trim()}.`);
for (const script of ["buildReact", "typecheckServer"]) {
  const result = spawnSync(node, [npm, "run", script], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
