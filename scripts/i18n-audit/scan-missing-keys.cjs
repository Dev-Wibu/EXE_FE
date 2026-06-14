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

function loadLocaleKeys(localePath) {
  try {
    const content = fs.readFileSync(localePath, "utf8");
    const json = JSON.parse(content);
    return new Set(getJsonKeys(json));
  } catch (e) {
    console.error(`Error loading locale ${localePath}:`, e);
    return new Set();
  }
}

const localesDir = path.join(__dirname, "../../src/locales");
const viKeys = loadLocaleKeys(path.join(localesDir, "vi.json"));
const enKeys = loadLocaleKeys(path.join(localesDir, "en.json"));
const jaKeys = loadLocaleKeys(path.join(localesDir, "ja.json"));

const results = [];

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
  // Match t("key.path") or t('key.path')
  const regex = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  const lines = content.split("\n");

  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const missingInVi = !viKeys.has(key);
    const missingInEn = !enKeys.has(key);
    const missingInJa = !jaKeys.has(key);

    if (missingInVi || missingInEn || missingInJa) {
      // Find line number
      let lineNum = 1;
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 for newline
        if (match.index < charCount) {
          lineNum = i + 1;
          break;
        }
      }

      results.push({
        file: path.relative(path.join(__dirname, "../.."), filePath).replace(/\\/g, "/"),
        line: lineNum,
        key: key,
        missingIn: [
          missingInVi ? "vi" : null,
          missingInEn ? "en" : null,
          missingInJa ? "ja" : null,
        ].filter(Boolean),
      });
    }
  }
}

const srcDir = path.join(__dirname, "../../src");
console.log(`Starting missing keys scan on: ${srcDir}\n`);
walk(srcDir);

if (results.length > 0) {
  console.log("=== MISSING i18n KEYS SUMMARY ===");
  console.log(`Found ${results.length} missing key usages.\n`);

  const grouped = {};
  results.forEach((r) => {
    if (!grouped[r.key]) grouped[r.key] = [];
    grouped[r.key].push(r);
  });

  for (const [key, usages] of Object.entries(grouped)) {
    console.log(`❌ Key: "${key}"`);
    console.log(`   Missing in: ${usages[0].missingIn.join(", ")}`);
    console.log(`   Used in:`);
    const filesSeen = new Set();
    usages.forEach((u) => {
      if (!filesSeen.has(u.file)) {
        console.log(`      - ${u.file}:${u.line}`);
        filesSeen.add(u.file);
      }
    });
    console.log("");
  }

  console.log("Error: Missing i18n keys found. Please add them to your JSON locales.");
  process.exit(1);
} else {
  console.log("🎉 Outstanding! No missing i18n keys found!");
  process.exit(0);
}
