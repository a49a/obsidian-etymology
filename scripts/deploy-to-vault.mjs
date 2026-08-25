import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");

function parseArgs() {
	const args = process.argv.slice(2);
	const result = {
		vaultPath: process.env.OBSIDIAN_VAULT_PATH,
		pluginDir: process.env.OBSIDIAN_PLUGIN_DIR,
	};

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--vault" && args[i + 1]) {
			result.vaultPath = args[i + 1];
			i += 1;
			continue;
		}
		if (arg.startsWith("--vault=")) {
			result.vaultPath = arg.slice("--vault=".length);
			continue;
		}
		if (arg === "--plugin-dir" && args[i + 1]) {
			result.pluginDir = args[i + 1];
			i += 1;
			continue;
		}
		if (arg.startsWith("--plugin-dir=")) {
			result.pluginDir = arg.slice("--plugin-dir=".length);
		}
	}

	return result;
}

function resolvePath(inputPath) {
	if (!inputPath || !inputPath.trim()) {
		return undefined;
	}
	return path.isAbsolute(inputPath) ? inputPath : path.resolve(ROOT, inputPath);
}

async function readPluginId() {
	const raw = await fs.readFile(MANIFEST_PATH, "utf8");
	const manifest = JSON.parse(raw);
	if (!manifest?.id || typeof manifest.id !== "string") {
		throw new Error("manifest.json is missing a valid plugin id");
	}
	return manifest.id;
}

async function ensureFileExists(filePath) {
	try {
		await fs.access(filePath);
	} catch {
		throw new Error(`Required file not found: ${filePath}`);
	}
}

async function copyIfExists(fromPath, toPath) {
	try {
		await fs.copyFile(fromPath, toPath);
		return true;
	} catch (error) {
		if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

async function main() {
	const { vaultPath, pluginDir } = parseArgs();
	const resolvedVaultPath = resolvePath(vaultPath);
	const resolvedPluginDir = resolvePath(pluginDir);
	const pluginId = await readPluginId();

	const targetPluginDir = resolvedPluginDir
		?? (resolvedVaultPath
			? path.join(resolvedVaultPath, ".obsidian", "plugins", pluginId)
			: undefined);

	if (!targetPluginDir) {
		throw new Error(
			"Missing target path. Use --vault <VaultPath> or --plugin-dir <PluginDir>, or set OBSIDIAN_VAULT_PATH / OBSIDIAN_PLUGIN_DIR."
		);
	}

	const sourceMain = path.join(DIST_DIR, "main.js");
	const sourceManifest = path.join(DIST_DIR, "manifest.json");
	const sourceStyles = path.join(DIST_DIR, "styles.css");

	await ensureFileExists(sourceMain);
	await ensureFileExists(sourceManifest);
	await fs.mkdir(targetPluginDir, { recursive: true });

	await fs.copyFile(sourceMain, path.join(targetPluginDir, "main.js"));
	await fs.copyFile(sourceManifest, path.join(targetPluginDir, "manifest.json"));
	const hasStyles = await copyIfExists(sourceStyles, path.join(targetPluginDir, "styles.css"));

	console.log(`Deployed plugin to: ${targetPluginDir}`);
	console.log("Copied: main.js, manifest.json" + (hasStyles ? ", styles.css" : ""));
	console.log("Tip: In Obsidian, run 'Reload app without saving' to refresh plugin code quickly.");
}

main().catch((error) => {
	console.error("Deployment failed:", error);
	process.exit(1);
});
