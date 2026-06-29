const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "../src");

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(SRC_DIR);
let hasError = false;

files.forEach((file) => {
  if (file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".spec.tsx")) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("const t = i18n.t.bind(i18n)")) {
      console.error(
        `❌ AP-12 Violation: Found module-level "const t = i18n.t.bind(i18n)" in React component file: ${file}`
      );
      console.error(`   Please use the useTranslation() hook inside the component instead.`);
      hasError = true;
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log("✅ Passed AP-12 i18n rules check.");
  process.exit(0);
}
