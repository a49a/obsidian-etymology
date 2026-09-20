import { Notice, TFile, TFolder, type Vault } from "obsidian";
import { generateWithAI } from "../ai-provider";
import { t, type ResolvedLanguage } from "../i18n";
import { DEFAULT_SETTINGS } from "../settings";
import type EtymologyLookupPlugin from "../main";
import { WordOrganizationModal } from "../ui/wordOrganizationModal";
import {
	buildOrganizationPrompt,
	parseOrganizationPlan,
	type WordOrganizationAssignment,
} from "./organizePlan";
import { ensureFolder, isPathWithinDirectory, resolveOutputDir } from "../utils/paths";

export async function organizeAiWordNotes(plugin: EtymologyLookupPlugin): Promise<void> {
	const language = plugin.getLanguage();

	if (!plugin.settings.deepseekApiKey) {
		new Notice(t(language, "noticeMissingApiKey"));
		return;
	}

	let progressNotice: Notice | undefined;
	const updateProgress = (message: string): void => {
		progressNotice?.hide();
		progressNotice = new Notice(message, 0);
	};
	const clearProgress = (): void => {
		progressNotice?.hide();
		progressNotice = undefined;
	};

	try {
		updateProgress(t(language, "noticeOrganizeScanning"));
		const outputDir = resolveOutputDir(plugin.settings.deepseekOutputDir || "deepseek-results", language);
		const folder = plugin.app.vault.getAbstractFileByPath(outputDir);
		if (!(folder instanceof TFolder)) {
			new Notice(t(language, "noticeOrganizeFolderMissing", { path: outputDir }));
			return;
		}

		// Only top-level files are organized; existing semantic-group
		// subfolders are left untouched.
		const files = folder.children.filter(
			(child): child is TFile => child instanceof TFile && child.extension.toLowerCase() === "md"
		);
		if (files.length === 0) {
			clearProgress();
			new Notice(t(language, "noticeOrganizeNoFiles"));
			return;
		}

		updateProgress(t(language, "noticeOrganizePreparing", { count: String(files.length) }));
		const fileNames = files.map((file) => file.name);
		const template = plugin.settings.organizePromptTemplate.trim() || DEFAULT_SETTINGS.organizePromptTemplate;
		const prompt = buildOrganizationPrompt(template, fileNames);
		updateProgress(t(language, "noticeOrganizeWaitingForLlm", { count: String(files.length) }));
		const response = await generateWithAI({
			provider: plugin.settings.modelProvider,
			apiKey: plugin.settings.deepseekApiKey,
			baseUrl: plugin.settings.deepseekBaseUrl,
			model: plugin.settings.deepseekModel,
			prompt,
			timeoutSeconds: plugin.settings.aiTimeoutSeconds,
		});
		updateProgress(t(language, "noticeOrganizeParsing"));
		const assignments = parseOrganizationPlan(response, fileNames, language);
		updateProgress(t(language, "noticeOrganizeAwaitingConfirmation", { count: String(assignments.length) }));

		new WordOrganizationModal(plugin.app, language, assignments, async () => {
			try {
				updateProgress(t(language, "noticeOrganizeMoving", { count: String(assignments.length) }));
				await applyOrganizationPlan(plugin.app.vault, outputDir, assignments, language, (current, total) => {
					updateProgress(t(language, "noticeOrganizeMoved", {
						current: String(current),
						total: String(total),
					}));
				});
			} catch (error) {
				console.error("Applying word organization plan failed", error);
				clearProgress();
				new Notice(t(language, "noticeOrganizeFailed", {
					error: error instanceof Error ? error.message : String(error),
				}));
			}
		}, clearProgress).open();
	} catch (error) {
		console.error("Word organization failed", error);
		clearProgress();
		plugin.debugLog("Word organization failed", {
			errorMessage: error instanceof Error ? error.message : String(error),
		});
		new Notice(t(language, "noticeOrganizeFailed", {
			error: error instanceof Error ? error.message : String(error),
		}));
	}
}

async function applyOrganizationPlan(
	vault: Vault,
	outputDir: string,
	assignments: WordOrganizationAssignment[],
	language: ResolvedLanguage,
	onMoveProgress: (current: number, total: number) => void
): Promise<void> {
	const normalizedOutputDir = outputDir.replace(/\/+$/, "");
	const currentFolder = vault.getAbstractFileByPath(normalizedOutputDir);
	if (!(currentFolder instanceof TFolder)) {
		throw new Error(t(language, "noticeOrganizeFolderMissing", { path: normalizedOutputDir }));
	}

	const moves = assignments.map((assignment) => {
		const sourcePath = `${outputDir}/${assignment.file}`;
		const targetPath = `${outputDir}/${assignment.folder}/${assignment.file}`;
		if (
			!isPathWithinDirectory(sourcePath, normalizedOutputDir) ||
			!isPathWithinDirectory(targetPath, normalizedOutputDir)
		) {
			throw new Error(t(language, "organizeOutOfScope"));
		}

		const source = vault.getAbstractFileByPath(sourcePath);
		if (!(source instanceof TFile)) {
			throw new Error(t(language, "organizeFileMissing", { file: assignment.file }));
		}
		const existing = vault.getAbstractFileByPath(targetPath);
		if (existing && targetPath !== sourcePath) {
			throw new Error(t(language, "organizeTargetExists", { file: assignment.file }));
		}
		return { source, targetPath };
	});

	for (const [index, move] of moves.entries()) {
		const parentDir = move.targetPath.slice(0, move.targetPath.lastIndexOf("/"));
		await ensureFolder(vault, parentDir, language);
		if (move.source.path !== move.targetPath) {
			await vault.rename(move.source, move.targetPath);
		}
		onMoveProgress(index + 1, moves.length);
	}
	new Notice(t(language, "noticeOrganizeSaved", { count: String(assignments.length) }));
}
