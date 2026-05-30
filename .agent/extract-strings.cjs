const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const VIETNAMESE_REGEX =
  /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđùúủũụưứừửữựìíỉĩịòóỏõọôốồổỗộơớờởỡợỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆĐÙÚỦŨỤƯỪỨỰỬỮỲÝỶỸỴĐ]/;

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
        file !== "cypress"
      ) {
        walk(fullPath);
      }
    } else if (/\.(ts|tsx)$/.test(file)) {
      analyzeFile(fullPath);
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

    if (ts.isStringLiteral(node)) {
      text = node.text;
      type = "StringLiteral";
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      text = node.text;
      type = "TemplateLiteral";
    } else if (node.kind === ts.SyntaxKind.JsxText) {
      text = node.text.trim();
      type = "JsxText";
    }

    if (text && VIETNAMESE_REGEX.test(text)) {
      // Get line number
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      results.push({
        file: path.relative(path.join(__dirname, ".."), filePath).replace(/\\/g, "/"),
        line: line + 1,
        character: character + 1,
        type,
        text,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const srcDir = path.join(__dirname, "../src");
walk(srcDir);

fs.writeFileSync(
  path.join(__dirname, "vietnamese_strings.json"),
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log(`Found ${results.length} Vietnamese strings in the codebase.`);
