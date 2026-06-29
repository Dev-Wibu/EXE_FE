const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const VIETNAMESE_REGEX =
  /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđùúủũụưứừửữựìíỉĩịòóỏõọôốồổỗộơớờởỡợỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆĐÙÚỦŨỤƯỪỨỰỬỮỲÝỶỸỴĐ]/;

const JAPANESE_REGEX =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/;

// A helper regex to check if a string contains English letters
const ENGLISH_LETTERS = /[a-zA-Z]/;

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
      // Skip test files
      if (!file.endsWith(".test.ts") && !file.endsWith(".test.tsx")) {
        analyzeFile(fullPath);
      }
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let sourceFile;
  try {
    sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err);
    return;
  }

  function visit(node) {
    let text = null;
    let type = null;
    let category = null; // 'vietnamese' | 'japanese' | 'english'

    // 1. Check JSX attribute values (like placeholder="Search")
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const attrName = node.name.text;
      const userFacingAttributes = [
        "placeholder",
        "label",
        "title",
        "alt",
        "description",
        "message",
        "text",
        "content",
        "heading",
      ];

      if (userFacingAttributes.includes(attrName)) {
        const val = node.initializer.text.trim();
        if (val && ENGLISH_LETTERS.test(val)) {
          text = val;
          type = `JsxAttribute[${attrName}]`;
          if (VIETNAMESE_REGEX.test(val)) {
            category = "vietnamese";
          } else if (JAPANESE_REGEX.test(val)) {
            category = "japanese";
          } else {
            category = "english";
          }
        }
      }
    }

    // 2. Check JSX Text children (like <span>Cancel</span>)
    else if (node.kind === ts.SyntaxKind.JsxText) {
      const val = node.text.trim();
      // Only care if it contains letters (i.e. not just whitespace or symbols)
      if (val && ENGLISH_LETTERS.test(val)) {
        text = val;
        type = "JsxText";
        if (VIETNAMESE_REGEX.test(val)) {
          category = "vietnamese";
        } else if (JAPANESE_REGEX.test(val)) {
          category = "japanese";
        } else {
          category = "english";
        }
      }
    }

    // 3. Check generic string/template literals containing Vietnamese or Japanese
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const val = node.text.trim();
      if (val) {
        if (VIETNAMESE_REGEX.test(val)) {
          text = val;
          type = ts.isStringLiteral(node) ? "StringLiteral" : "TemplateLiteral";
          category = "vietnamese";
        } else if (JAPANESE_REGEX.test(val)) {
          text = val;
          type = ts.isStringLiteral(node) ? "StringLiteral" : "TemplateLiteral";
          category = "japanese";
        }
      }
    }

    if (text && category) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      results.push({
        file: path.relative(path.join(__dirname, "../.."), filePath).replace(/\\/g, "/"),
        line: line + 1,
        character: character + 1,
        type,
        category,
        text,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const srcDir = path.join(__dirname, "../../src");
console.log(`Starting i18n scan on: ${srcDir}\n`);
walk(srcDir);

// Split results by category
const viResults = results.filter((r) => r.category === "vietnamese");
const jaResults = results.filter((r) => r.category === "japanese");
const enResults = results.filter((r) => r.category === "english");

// Write JSON Reports
fs.writeFileSync(
  path.join(__dirname, "vietnamese-report.json"),
  JSON.stringify(viResults, null, 2),
  "utf8"
);
fs.writeFileSync(
  path.join(__dirname, "japanese-report.json"),
  JSON.stringify(jaResults, null, 2),
  "utf8"
);
fs.writeFileSync(
  path.join(__dirname, "english-report.json"),
  JSON.stringify(enResults, null, 2),
  "utf8"
);

// Print Summary
console.log("=== I18N AUDIT SUMMARY ===");
console.log(`Total Issues Found: ${results.length}`);
console.log(`  - Vietnamese (Hardcoded): ${viResults.length}`);
console.log(`  - Japanese (Hardcoded):   ${jaResults.length}`);
console.log(`  - English/JSX (Hardcoded): ${enResults.length}`);
console.log("Reports saved to:");
console.log("  - scripts/i18n-audit/vietnamese-report.json");
console.log("  - scripts/i18n-audit/japanese-report.json");
console.log("  - scripts/i18n-audit/english-report.json\n");

if (results.length > 0) {
  // Count by file
  const fileCounts = {};
  results.forEach((item) => {
    fileCounts[item.file] = (fileCounts[item.file] || 0) + 1;
  });

  const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);

  console.log("Top files with the most hardcoded strings:");
  sortedFiles.slice(0, 15).forEach(([file, count]) => {
    console.log(`  - ${file}: ${count} issues`);
  });
} else {
  console.log("🎉 Outstanding! No hardcoded user-facing strings found in the codebase!");
}

if (viResults.length > 0) {
  console.error(
    `\n❌ Error: Found ${viResults.length} hardcoded Vietnamese strings. Please use t() from react-i18next.`
  );
  process.exit(1);
}
