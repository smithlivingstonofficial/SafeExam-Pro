const { execSync } = require("child_process");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName === "darwin") {
    const appPath = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`
    );
    console.log(`[AfterPack] Ad-hoc signing macOS application bundle at: ${appPath}`);
    execSync(`codesign -s - --force --deep "${appPath}"`, { stdio: "inherit" });
    console.log(`[AfterPack] Ad-hoc code signing completed successfully.`);
  }
};
