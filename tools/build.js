#!/usr/bin/env node
const fs = require("fs/promises");
const path = require("path");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SKIP_ENTRIES = new Set([
  "node_modules",
  "dist",
  "tools",
  ".git",
  "package.json",
  "package-lock.json",
]);

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  await copyProjectFiles();

  await overwriteWithMinified("style.css", minifyCSS);
  await overwriteWithMinified("window-content.css", minifyCSS);
  await overwriteWithMinified("script.js", minifyJS);

  console.log("Build completed. Output available in dist/.");
}

async function copyProjectFiles() {
  const entries = await fs.readdir(ROOT);
  for (const entry of entries) {
    if (SKIP_ENTRIES.has(entry)) continue;
    if (entry.startsWith(".")) continue;

    const source = path.join(ROOT, entry);
    const destination = path.join(DIST, entry);
    await fs.cp(source, destination, { recursive: true });
  }
}

async function overwriteWithMinified(filename, minifier) {
  const sourcePath = path.join(ROOT, filename);
  const distPath = path.join(DIST, filename);
  const source = await fs.readFile(sourcePath, "utf8");
  const minified = minifier(source);
  await fs.writeFile(distPath, minified, "utf8");
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJS(code) {
  let result = "";
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (char === "/" && next === "/") {
        inLineComment = true;
        i += 1;
        continue;
      }
      if (char === "/" && next === "*") {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    result += char;

    if (char === "\\") {
      const escaped = code[i + 1];
      if (escaped) {
        result += escaped;
        i += 1;
      }
      continue;
    }

    if (!inDouble && !inTemplate && char === "'" && !inSingle) {
      inSingle = true;
      continue;
    }
    if (inSingle && char === "'") {
      inSingle = false;
      continue;
    }

    if (!inSingle && !inTemplate && char === '"' && !inDouble) {
      inDouble = true;
      continue;
    }
    if (inDouble && char === '"') {
      inDouble = false;
      continue;
    }

    if (!inSingle && !inDouble && char === "`") {
      inTemplate = !inTemplate;
    }
  }

  return result;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
