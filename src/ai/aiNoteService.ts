import { Notice, TFile, type Editor } from "obsidian";
import { generateWithAI } from "../ai-provider";
import { t } from "../i18n";
import { buildDeepSeekPrompt } from "../settings";
import type EtymologyLookupPlugin from "../main";
import type { LastAiDebugSnapshot } from "../ui/debugResultModal";
import { ensureFolder, getBaseOutputPath, resolveOutputDir } from "../utils/paths";
import { buildAppendBlock, buildInitialContent, parseDefaultTags } from "../utils/noteContent";
import {
	normalizeSelectedTextForAi,
	type SelectionSnapshot,
	wrapSelectionWithWikiLink,
} from "../utils/selection";

export type TriggerSource = "command" | "menu";

export interface PendingAiRequest {
	selectedText: string;
	sourceFilePath?: string;
	editor?: Editor;
	selectionSnapshot?: SelectionSnapshot;
	triggerSource: TriggerSource;
}

interface LastGenerationRecord {
	key: string;
	filePath: string;
	createdAt: number;
}

export class AiNoteService {
	private queue: PendingAiRequest[] = [];
	private isGenerating = false;
	private lastGeneration?: LastGenerationRecord;
	lastDebugSnapshot?: LastAiDebugSnapshot;

	constructor(private readonly plugin: EtymologyLookupPlugin) {}

	enqueue(request: PendingAiRequest): void {
		this.queue.push(request);
		this.plugin.debugLog("Queued AI request", {
			triggerSource: request.triggerSource,
			queueLength: this.queue.length,
		});

		void this.processNext();
	}

	private async processNext(): Promise<void> {
		if (this.isGenerating) {
			return;
		}

		const nextRequest = this.queue.shift();
		if (!nextRequest) {
			return;
		}

		this.isGenerating = true;
		try {
			await this.handleSelection(nextRequest);
		} finally {
			this.isGenerating = false;
		}

		if (this.queue.length > 0) {
			void this.processNext();
		}
	}

	private async handleSelection(request: PendingAiRequest): Promise<void> {
		const { plugin } = this;
		const language = plugin.getLanguage();
		const normalizedSelectedText = normalizeSelectedTextForAi(request.selectedText);

		plugin.debugLog("AI command triggered", {
			triggerSource: request.triggerSource,
			sourceFilePath: request.sourceFilePath ?? "",
			selectedTextLength: normalizedSelectedText.length,
		});

		if (!normalizedSelectedText) {
			new Notice(t(language, "noticeSelectTextForAi"));
			return;
		}

		if (!plugin.settings.deepseekApiKey) {
			plugin.debugLog("Skipped because API key is empty", { triggerSource: request.triggerSource });
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
			updateProgress(t(language, "noticeAiPreparing", { text: request.selectedText }));

			const prompt = buildDeepSeekPrompt(plugin.settings.deepseekPromptTemplate, normalizedSelectedText);

			updateProgress(t(language, "noticeAiWaitingForLlm", { text: request.selectedText }));
			const generatedText = await generateWithAI({
				provider: plugin.settings.modelProvider,
				apiKey: plugin.settings.deepseekApiKey,
				baseUrl: plugin.settings.deepseekBaseUrl,
				model: plugin.settings.deepseekModel,
				prompt,
				timeoutSeconds: plugin.settings.aiTimeoutSeconds,
			});
			updateProgress(t(language, "noticeAiResponseReceived"));

			this.lastDebugSnapshot = {
				provider: plugin.settings.modelProvider,
				model: plugin.settings.deepseekModel,
				selectedText: normalizedSelectedText,
				prompt,
				response: generatedText,
				timestamp: Date.now(),
			};

			plugin.debugLog("AI response received", {
				triggerSource: request.triggerSource,
				provider: plugin.settings.modelProvider,
				generatedTextLength: generatedText.length,
			});

			const generationKey = `${request.sourceFilePath ?? ""}|${normalizedSelectedText}|${generatedText}`;
			const now = Date.now();
			if (
				this.lastGeneration &&
				this.lastGeneration.key === generationKey &&
				now - this.lastGeneration.createdAt < 15_000
			) {
				plugin.debugLog("Dedup hit; reused existing file", {
					triggerSource: request.triggerSource,
					filePath: this.lastGeneration.filePath,
				});
				clearProgress();
				new Notice(t(language, "noticeAiSaved", { path: this.lastGeneration.filePath }));
				return;
			}

			updateProgress(t(language, "noticeAiWritingFile"));
			const outputFilePath = await this.writeResult(normalizedSelectedText, generatedText, request.sourceFilePath);
			plugin.debugLog("Created AI result file", { triggerSource: request.triggerSource, outputFilePath });
			this.lastGeneration = {
				key: generationKey,
				filePath: outputFilePath,
				createdAt: now,
			};
			updateProgress(t(language, "noticeAiUpdatingLink"));
			wrapSelectionWithWikiLink(
				request.editor,
				request.selectionSnapshot,
				normalizedSelectedText,
				outputFilePath,
				(message, details) => plugin.debugLog(message, details)
			);
			clearProgress();
			new Notice(t(language, "noticeAiSaved", { path: outputFilePath }));
		} catch (error) {
			console.error("AI generation failed", error);
			clearProgress();
			plugin.debugLog("AI generation failed", {
				errorMessage: error instanceof Error ? error.message : String(error),
			});
			new Notice(t(language, "noticeAiFailed", {
				error: error instanceof Error ? error.message : String(error),
			}));
		}
	}

	private async writeResult(
		selectedText: string,
		result: string,
		sourceFilePath?: string
	): Promise<string> {
		const { plugin } = this;
		const language = plugin.getLanguage();
		const outputDir = resolveOutputDir(plugin.settings.deepseekOutputDir || "deepseek-results", language);
		await ensureFolder(plugin.app.vault, outputDir, language);

		const filePath = getBaseOutputPath(outputDir, selectedText);
		const existing = plugin.app.vault.getAbstractFileByPath(filePath);

		if (existing instanceof TFile) {
			if (plugin.settings.aiWriteMode === "overwrite") {
				const content = buildInitialContent(result, parseDefaultTags(plugin.settings.deepseekDefaultTags));
				await plugin.app.vault.modify(existing, content);
				plugin.debugLog("Overwrote existing AI note", { filePath });
				return filePath;
			}

			const appendedBlock = buildAppendBlock(result);
			await plugin.app.vault.append(existing, appendedBlock);
			plugin.debugLog("Appended AI result to existing note", { filePath });
			return filePath;
		}

		const content = buildInitialContent(result, parseDefaultTags(plugin.settings.deepseekDefaultTags));
		await plugin.app.vault.create(filePath, content);
		plugin.debugLog("Created new AI note", { filePath });
		return filePath;
	}
}
