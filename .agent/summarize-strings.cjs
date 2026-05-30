const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "vietnamese_strings.json"), "utf8"));

console.log(`Total strings: ${data.length}`);

// Count by file
const fileCounts = {};
const dirCounts = {};

data.forEach((item) => {
  fileCounts[item.file] = (fileCounts[item.file] || 0) + 1;

  const parts = item.file.split("/");
  let dir = parts[0];
  if (parts[1]) dir += "/" + parts[1];
  if (parts[2] && (parts[1] === "pages" || parts[1] === "components")) {
    dir += "/" + parts[2];
  }
  dirCounts[dir] = (dirCounts[dir] || 0) + 1;
});

const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
const sortedDirs = Object.entries(dirCounts).sort((a, b) => b[1] - a[1]);

console.log("\nTop 20 files with the most Vietnamese strings:");
sortedFiles.slice(0, 20).forEach(([file, count]) => {
  console.log(`  - ${file}: ${count}`);
});

console.log("\nDirectory distribution:");
sortedDirs.forEach(([dir, count]) => {
  console.log(`  - ${dir}: ${count}`);
});

console.log(`\nUnique files: ${Object.keys(fileCounts).length}`);
