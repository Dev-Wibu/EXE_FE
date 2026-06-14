const fs = require("fs");
const path = require("path");

function getJsonKeys(obj, prefix = "") {
  let keys = [];
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys = keys.concat(getJsonKeys(obj[key], newPrefix));
    } else {
      keys.push(newPrefix);
    }
  }
  return keys;
}

function loadLocaleJson(localePath) {
  try {
    const content = fs.readFileSync(localePath, "utf8");
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

function setNestedKey(obj, pathStr, value) {
  const parts = pathStr.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  if (current[parts[parts.length - 1]] === undefined) {
    current[parts[parts.length - 1]] = value;
  }
}

const localesDir = path.join(__dirname, "../../src/locales");
const viPath = path.join(localesDir, "vi.json");
const enPath = path.join(localesDir, "en.json");
const jaPath = path.join(localesDir, "ja.json");

const viJson = loadLocaleJson(viPath);
const enJson = loadLocaleJson(enPath);
const jaJson = loadLocaleJson(jaPath);

const viKeys = new Set(getJsonKeys(viJson));
const enKeys = new Set(getJsonKeys(enJson));
const jaKeys = new Set(getJsonKeys(jaJson));

let missingCount = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== ".git" &&
        file !== "dist" &&
        file !== ".nx" &&
        file !== "cypress" &&
        file !== "test"
      ) {
        walk(fullPath);
      }
    } else if (/\.(ts|tsx)$/.test(file)) {
      if (!file.endsWith(".test.ts") && !file.endsWith(".test.tsx")) {
        analyzeFile(fullPath);
      }
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const regex = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const key = match[1];

    if (!viKeys.has(key)) {
      setNestedKey(viJson, key, `[VI] ${key}`);
      viKeys.add(key);
      missingCount++;
    }
    if (!enKeys.has(key)) {
      setNestedKey(enJson, key, `[EN] ${key}`);
      enKeys.add(key);
      missingCount++;
    }
    if (!jaKeys.has(key)) {
      setNestedKey(jaJson, key, `[JA] ${key}`);
      jaKeys.add(key);
      missingCount++;
    }
  }
}

const srcDir = path.join(__dirname, "../../src");
console.log(`Starting missing keys FIX on: ${srcDir}\n`);
walk(srcDir);

if (missingCount > 0) {
  fs.writeFileSync(viPath, JSON.stringify(viJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(jaPath, JSON.stringify(jaJson, null, 2) + "\n", "utf8");
  console.log(`Fixed ${missingCount} missing keys across vi, en, ja!`);
} else {
  console.log("No missing keys to fix!");
}
