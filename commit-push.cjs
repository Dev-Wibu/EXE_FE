const { execSync } = require("child_process");
process.chdir("D:/Capstone/EXE_FE");
try {
  execSync("git add . && git commit -m \"chore: remove hardcoded fallback values in company components\"", { stdio: "inherit" });
  execSync("git pull --rebase origin feat/homepage-redesign-stitch-integration && git push", { stdio: "inherit" });
  console.log("Done!");
} catch (e) {}
