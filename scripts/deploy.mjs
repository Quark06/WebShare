import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed. ${result.stderr || ""}`);
  }
  return result.stdout?.trim();
}

try {
  if (Number(process.versions.node.split(".")[0]) < 24) {
    throw new Error("Deployment requires Node.js 24 or newer.");
  }
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Run this script with npm run deploy.");
  if (run("git", ["branch", "--show-current"], true) !== "master") {
    throw new Error("Switch to master before deploying.");
  }
  if (run("git", ["status", "--porcelain"], true)) {
    throw new Error("Commit or move local changes before deploying; .env is ignored.");
  }
  run("git", ["pull", "--ff-only", "origin", "master"]);
  run(process.execPath, [npmCli, "ci", "--include=dev"]);
  run(process.execPath, [npmCli, "run", "build"]);
  run(process.execPath, [
    join(root, "node_modules/pm2/bin/pm2"),
    "startOrRestart",
    "ecosystem.config.cjs",
    "--only",
    "webshare",
    "--update-env",
  ]);
  console.log("WebShare restart requested. Check /ping and the PM2 logs before accepting traffic.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
