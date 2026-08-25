import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "manifest.json");
const mainJsPath = path.join(ROOT, "main.js");
const stylesPath = path.join(ROOT, "styles.css");

function getCliOutDir() {
	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--out" && args[i + 1]) {
			return args[i + 1];
		}
		if (arg.startsWith("--out=")) {
			return arg.slice("--out=".length);
		}
	}
	return undefined;
}

function resolveOutputDir() {
	const rawOutDir = getCliOutDir() ?? process.env.RELEASE_OUTPUT_DIR ?? "dist";
	if (!rawOutDir.trim()) {
		throw new Error("Release output directory is empty");
	}

	const resolvedPath = path.isAbsolute(rawOutDir)
		? rawOutDir
		: path.resolve(ROOT, rawOutDir);

	return {
		rawOutDir,
		resolvedPath,
	};
}

async function readManifestId() {
	const raw = await fs.readFile(manifestPath, "utf8");
	const manifest = JSON.parse(raw);
	if (!manifest?.id || typeof manifest.id !== "string") {
		throw new Error("manifest.json is missing a valid id");
	}
	return manifest.id;
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
	const pluginId = await readManifestId();
	const { rawOutDir, resolvedPath: outDir } = resolveOutputDir();
	const defaultDistDir = path.join(ROOT, "dist");
	const legacyOutDir = path.join(defaultDistDir, pluginId);

	await fs.mkdir(outDir, { recursive: true });

	if (path.resolve(outDir) === path.resolve(defaultDistDir)) {
		await fs.rm(legacyOutDir, { recursive: true, force: true });
	}

	await fs.copyFile(mainJsPath, path.join(outDir, "main.js"));
	await fs.copyFile(manifestPath, path.join(outDir, "manifest.json"));

	const hasStyles = await copyIfExists(stylesPath, path.join(outDir, "styles.css"));

	console.log(`Release files prepared in: ${rawOutDir}`);
	console.log("Included: main.js, manifest.json" + (hasStyles ? ", styles.css" : ""));
}

main().catch((error) => {
	console.error("Failed to prepare release files:", error);
	process.exit(1);
});
