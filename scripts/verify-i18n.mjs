// Offline checks for the Chinese translations. Run with Node 24: node scripts/verify-i18n.mjs
// Every literal passed to t() or msg() in src/ needs a Chinese entry with the same {placeholders};
// entries no code uses are reported, and server messages must still exist in server/.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { default: zh, serverMessages, sharedNames } = await import("../src/i18n/zh.ts");

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

// t("text") / t('text') / t(`text`) / msg(...), including a literal broken onto the next line
const call = /(?<![\w.$])(?:t|msg)\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const used = new Map();
const problems = [];
for (const file of sourceFiles(join(root, "src"))) {
  if (file.startsWith(join(root, "src", "i18n"))) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(call)) {
    const [, quote, raw] = match;
    const line = source.slice(0, match.index).split("\n").length;
    const where = `${relative(root, file)}:${line}`;
    if (quote === "`" && raw.includes("${")) {
      problems.push(`${where} interpolates into t(); use {placeholders} and params instead`);
      continue;
    }
    const text = raw.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
    if (!used.has(text)) used.set(text, where);
  }
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const [text, where] of used) {
  if (!(text in zh)) problems.push(`${where} has no Chinese translation: ${JSON.stringify(text)}`);
}
for (const [text, translation] of Object.entries(zh)) {
  if (!translation.trim()) problems.push(`Empty translation for ${JSON.stringify(text)}`);
  if (placeholders(text) !== placeholders(translation)) {
    problems.push(`Placeholders differ for ${JSON.stringify(text)}: ${JSON.stringify(translation)}`);
  }
}
console.log(`PASS checked ${used.size} texts used in src/ against ${Object.keys(zh).length} translations`);

const serverSource = sourceFiles(join(root, "server")).map((file) => readFileSync(file, "utf8")).join("\n");
const sharedSource = readFileSync(join(root, "src/utils/music.ts"), "utf8");
for (const text of Object.keys(zh)) {
  if (used.has(text)) continue;
  if (text in serverMessages) {
    if (!serverSource.includes(text)) problems.push(`Server message no longer exists in server/: ${JSON.stringify(text)}`);
  } else if (text in sharedNames) {
    if (!sharedSource.includes(JSON.stringify(text))) problems.push(`Name no longer exists in src/utils/music.ts: ${JSON.stringify(text)}`);
  } else {
    problems.push(`Translation is not used in src/: ${JSON.stringify(text)}`);
  }
}

assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
console.log(
  `PASS every translation is used; ${Object.keys(serverMessages).length} server messages and ${Object.keys(sharedNames).length} shared names still exist`,
);
console.log("All translation checks passed.");
