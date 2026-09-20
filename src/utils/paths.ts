import type { Vault } from "obsidian";
import { t, type ResolvedLanguage } from "../i18n";

/**
 * Pure path helpers kept free of the Obsidian API so they can be unit tested.
 * The normalization mirrors Obsidian's `normalizePath`: backslashes become
 * slashes, duplicate slashes collapse, leading/trailing slashes are removed.
 */

export function normalizeSlashes(inputPath: string): string {
	return inputPath
		.replace(/\\/g, "/")
		.replace(/\/+/g, "/")
		.replace(/^\/+|\/+$/g, "");
}

export function normalizeVaultPath(inputPath: string, language: ResolvedLanguage): string {
	const normalized = normalizeSlashes(inputPath);
	const parts = normalized.split("/");
	const stack: string[] = [];

	for (const part of parts) {
		if (!part || part === ".") {
			continue;
		}

		if (part === "..") {
			if (!stack.length) {
				throw new Error(t(language, "outputOutOfVaultError"));
			}
			stack.pop();
			continue;
		}

		stack.push(part);
	}

	if (!stack.length) {
		throw new Error(t(language, "outputEmptyError"));
	}

	return stack.join("/");
}

export function resolveOutputDir(configuredDir: string, language: ResolvedLanguage): string {
	const raw = configuredDir.trim();
	if (!raw) {
		return "deepseek-results";
	}

	if (raw.startsWith("./") || raw.startsWith("../")) {
		throw new Error(t(language, "outputRelativePathNotAllowed"));
	}

	return normalizeVaultPath(raw, language);
}

export function isPathWithinDirectory(filePath: string, directoryPath: string): boolean {
	const normalizedFilePath = normalizeSlashes(filePath);
	const normalizedDirectoryPath = normalizeSlashes(directoryPath);
	if (!normalizedDirectoryPath) {
		return true;
	}
	return normalizedFilePath.startsWith(`${normalizedDirectoryPath}/`);
}

export function getBaseOutputPath(outputDir: string, selectedText: string): string {
	const safeWord = selectedText
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 40) || "deepseek";
	return `${outputDir}/${safeWord}.md`;
}

export function toWikiLinkTarget(outputFilePath: string): string {
	return outputFilePath.endsWith(".md")
		? outputFilePath.slice(0, -3)
		: outputFilePath;
}

export async function ensureFolder(
	vault: Vault,
	folderPath: string,
	language: ResolvedLanguage
): Promise<void> {
	const normalized = normalizeSlashes(folderPath);
	if (!normalized) {
		return;
	}

	const parts = normalized.split("/").filter(Boolean);
	let currentPath = "";

	for (const part of parts) {
		currentPath = currentPath ? `${currentPath}/${part}` : part;
		// Folders expose `children`; files do not. Checking the property
		// directly keeps this module free of Obsidian runtime imports.
		const existing = vault.getAbstractFileByPath(currentPath) as { children?: unknown } | null;
		if (!existing) {
			await vault.createFolder(currentPath);
			continue;
		}

		if (!existing.children) {
			throw new Error(t(language, "pathConflictError", { path: currentPath }));
		}
	}
}
