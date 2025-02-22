import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the target browser from the command-line argument
const targetBrowser = process.argv[2]; // "firefox" or "chrome"
if (!targetBrowser) {
    console.error("❌ No browser target specified! Use: `npm run zip:firefox` or `npm run zip:chrome`");
    process.exit(1);
}

const distPath = path.resolve(__dirname, "../dist");
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"));
const zipFileName = `${targetBrowser}-extension-v${packageJson.version}.zip`;
const zipFilePath = path.resolve(__dirname, `../${zipFileName}`);

if (!fs.existsSync(distPath)) {
    console.error("❌ dist folder not found. Run `npm run build` first.");
    process.exit(1);
}

console.log(`📦 Creating ${zipFileName}...`);

const output = fs.createWriteStream(zipFilePath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
    console.log(`✅ Extension packed as ${zipFileName} (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
    throw err;
});

archive.pipe(output);
archive.directory(distPath, false);
archive.finalize();
