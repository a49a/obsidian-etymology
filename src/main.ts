// main.js
import {
    normalizePath,
    Plugin,
    Notice,
    Menu,
    TFile,
    TFolder,
    type Editor,
    type EditorPosition,
} from "obsidian";
import { generateWithAI } from "./deepseek";
import { fetchEtymology } from "./etymonline";
import { resolveLanguage, t } from "./i18n";
import { buildDeepSeekPrompt, DEFAULT_SETTINGS, EtymologyPluginSettings } from "./settings";
import { DebugResultModal, type LastAiDebugSnapshot } from "./ui/debugResultModal";
import { EtymologyResultModal } from "./ui/resultModal";
import { EtymologySettingTab } from "./ui/settingsTab";
import { WordOrganizationModal, type WordOrganizationAssignment } from "./ui/wordOrganizationModal";
import { removeDeletedAiNoteLinks, removeMissingAiNoteLinks } from "./utils/removeDeletedAiNoteLinks";

interface SelectionSnapshot {
    from: EditorPosition;
    to: EditorPosition;
    selectedText: string;
}

type TriggerSource = "command" | "menu";

interface LastGenerationRecord {
    key: string;
    filePath: string;
    createdAt: number;
}

interface PendingAiRequest {
    selectedText: string;
    sourceFilePath?: string;
    editor?: Editor;
    selectionSnapshot?: SelectionSnapshot;
    triggerSource: TriggerSource;
}

export default class EtymologyLookupPlugin extends Plugin {
    settings!: EtymologyPluginSettings;
    private isAiGenerating = false;
    private pendingAiRequests: PendingAiRequest[] = [];
    private lastGeneration?: LastGenerationRecord;
    private lastAiDebugSnapshot?: LastAiDebugSnapshot;

    async onload() {
        console.log('加载 Etymology Lookup Plugin');

        await this.loadSettings();
        this.addSettingTab(new EtymologySettingTab(this));
        const language = this.getLanguage();

        // 注册一个命令，用户可以通过命令面板调用
        this.addCommand({
            id: "lookup-etymology",
            name: t(language, "lookupCommandName"),
            // 当命令被执行时，这个回调函数会被调用
            editorCallback: async (editor) => {
                // 获取当前编辑器中选中的文本，并去除首尾空格
                const selectedText = editor.getSelection().trim();

                // 如果没有选中任何文本，则显示一个提示
                if (!selectedText) {
                    new Notice(t(this.getLanguage(), "noticeSelectTextForLookup"));
                    return;
                }

                new Notice(t(this.getLanguage(), "noticeLookupInProgress", { text: selectedText }));

                try {
                    const result = await fetchEtymology(selectedText);
                    new EtymologyResultModal(this.app, result, this.getLanguage()).open();
                } catch (error) {
                    console.error("Etymology lookup failed", error);
                    new Notice(t(this.getLanguage(), "noticeLookupFailed"));
                }
            },
        });

        this.addCommand({
            id: "generate-deepseek-note",
            name: t(language, "aiCommandName"),
            editorCallback: async (editor) => {
                const selectionSnapshot = this.captureSelectionSnapshot(editor);
                const selectedText = selectionSnapshot?.selectedText ?? "";
                this.enqueueAiRequest({
                    selectedText,
                    sourceFilePath: this.app.workspace.getActiveFile()?.path,
                    editor,
                    selectionSnapshot,
                    triggerSource: "command",
                });
            },
        });

        this.addCommand({
            id: "show-last-ai-debug-snapshot",
            name: t(language, "debugCommandName"),
            callback: () => {
                if (!this.lastAiDebugSnapshot) {
                    new Notice(t(this.getLanguage(), "noticeNoDebugSnapshot"));
                    return;
                }

                new DebugResultModal(this.app, this.getLanguage(), this.lastAiDebugSnapshot).open();
            },
        });

        this.addCommand({
            id: "organize-ai-word-notes",
            name: t(language, "organizeWordsCommandName"),
            callback: () => void this.organizeAiWordNotes(),
        });

		this.addCommand({
			id: "clean-missing-ai-note-links",
			name: t(language, "cleanMissingAiLinksCommandName"),
			callback: () => void this.cleanMissingAiNoteLinks(),
		});

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor) => {
                this.addLookupMenuItem(menu, () => editor.getSelection().trim());
                this.addDeepSeekMenuItem(menu, editor, () => editor.getSelection().trim());
            })
        );

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") {
					return;
				}
				void this.removeLinksForDeletedAiNote(file);
			})
		);
    }

    onunload() {
        console.log('卸载 Etymology Lookup Plugin');
    }

    private addLookupMenuItem(menu: Menu, getSelection: () => string) {
        menu.addItem((item) => {
            item
                .setTitle(t(this.getLanguage(), "lookupMenuName"))
                .setIcon("book")
                .onClick(async () => {
                    const selectedText = getSelection();
                    if (!selectedText) {
                        new Notice(t(this.getLanguage(), "noticeSelectTextForLookup"));
                        return;
                    }

                    new Notice(t(this.getLanguage(), "noticeLookupInProgress", { text: selectedText }));
                    try {
                        const result = await fetchEtymology(selectedText);
                        new EtymologyResultModal(this.app, result, this.getLanguage()).open();
                    } catch (error) {
                        console.error("Etymology lookup failed", error);
                        new Notice(t(this.getLanguage(), "noticeLookupFailed"));
                    }
                });
        });
    }

    private addDeepSeekMenuItem(menu: Menu, editor: Editor, getSelection: () => string) {
        menu.addItem((item) => {
            item
                .setTitle(t(this.getLanguage(), "aiMenuName"))
                .setIcon("sparkles")
                .onClick(async () => {
                    const selectionSnapshot = this.captureSelectionSnapshot(editor);
                    const selectedText = selectionSnapshot?.selectedText ?? getSelection();
                    this.enqueueAiRequest({
                        selectedText,
                        sourceFilePath: this.app.workspace.getActiveFile()?.path,
                        editor,
                        selectionSnapshot,
                        triggerSource: "menu",
                    });
                });
        });
    }

    private enqueueAiRequest(request: PendingAiRequest): void {
        this.pendingAiRequests.push(request);
        this.debugLog("Queued AI request", {
            triggerSource: request.triggerSource,
            queueLength: this.pendingAiRequests.length,
        });

        void this.processNextAiRequest();
    }

    private async processNextAiRequest(): Promise<void> {
        if (this.isAiGenerating) {
            return;
        }

        const nextRequest = this.pendingAiRequests.shift();
        if (!nextRequest) {
            return;
        }

        this.isAiGenerating = true;
        try {
            await this.handleDeepSeekForSelection(
                nextRequest.selectedText,
                nextRequest.sourceFilePath,
                nextRequest.editor,
                nextRequest.selectionSnapshot,
                nextRequest.triggerSource
            );
        } finally {
            this.isAiGenerating = false;
        }

        if (this.pendingAiRequests.length > 0) {
            void this.processNextAiRequest();
        }
    }

    private async handleDeepSeekForSelection(
        selectedText: string,
        sourceFilePath?: string,
        editor?: Editor,
        selectionSnapshot?: SelectionSnapshot,
        triggerSource: TriggerSource = "command"
    ): Promise<void> {
        const normalizedSelectedText = this.normalizeSelectedTextForAi(selectedText);

        this.debugLog("AI command triggered", {
            triggerSource,
            sourceFilePath: sourceFilePath ?? "",
            selectedTextLength: normalizedSelectedText.length,
        });

        if (!normalizedSelectedText) {
            new Notice(t(this.getLanguage(), "noticeSelectTextForAi"));
            return;
        }

        if (!this.settings.deepseekApiKey) {
            this.debugLog("Skipped because API key is empty", { triggerSource });
            new Notice(t(this.getLanguage(), "noticeMissingApiKey"));
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
            updateProgress(t(this.getLanguage(), "noticeAiPreparing", { text: selectedText }));

            const prompt = buildDeepSeekPrompt(
                this.settings.deepseekPromptTemplate,
                normalizedSelectedText
            );

            updateProgress(t(this.getLanguage(), "noticeAiWaitingForLlm", { text: selectedText }));
            const generatedText = await generateWithAI({
                provider: this.settings.modelProvider,
                apiKey: this.settings.deepseekApiKey,
                baseUrl: this.settings.deepseekBaseUrl,
                model: this.settings.deepseekModel,
                prompt,
            });
            updateProgress(t(this.getLanguage(), "noticeAiResponseReceived"));

            this.lastAiDebugSnapshot = {
                provider: this.settings.modelProvider,
                model: this.settings.deepseekModel,
                selectedText: normalizedSelectedText,
                prompt,
                response: generatedText,
                timestamp: Date.now(),
            };

            this.debugLog("AI response received", {
                triggerSource,
                provider: this.settings.modelProvider,
                generatedTextLength: generatedText.length,
            });

            const generationKey = `${sourceFilePath ?? ""}|${normalizedSelectedText}|${generatedText}`;
            const now = Date.now();
            if (
                this.lastGeneration &&
                this.lastGeneration.key === generationKey &&
                now - this.lastGeneration.createdAt < 15_000
            ) {
                this.debugLog("Dedup hit; reused existing file", {
                    triggerSource,
                    filePath: this.lastGeneration.filePath,
                });
                clearProgress();
                new Notice(t(this.getLanguage(), "noticeAiSaved", { path: this.lastGeneration.filePath }));
                return;
            }

            updateProgress(t(this.getLanguage(), "noticeAiWritingFile"));
            const outputFilePath = await this.writeDeepSeekResult(normalizedSelectedText, generatedText, sourceFilePath);
            this.debugLog("Created AI result file", { triggerSource, outputFilePath });
            this.lastGeneration = {
                key: generationKey,
                filePath: outputFilePath,
                createdAt: now,
            };
            updateProgress(t(this.getLanguage(), "noticeAiUpdatingLink"));
            this.wrapSelectionWithWikiLink(editor, selectionSnapshot, normalizedSelectedText, outputFilePath);
            clearProgress();
            new Notice(t(this.getLanguage(), "noticeAiSaved", { path: outputFilePath }));
        } catch (error) {
            console.error("AI generation failed", error);
            clearProgress();
            this.debugLog("AI generation failed", {
                triggerSource,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            new Notice(t(this.getLanguage(), "noticeAiFailed"));
        }
    }

    private async organizeAiWordNotes(): Promise<void> {
        if (!this.settings.deepseekApiKey) {
            new Notice(t(this.getLanguage(), "noticeMissingApiKey"));
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
            updateProgress(t(this.getLanguage(), "noticeOrganizeScanning"));
            const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results");
            const folder = this.app.vault.getAbstractFileByPath(outputDir);
            if (!(folder instanceof TFolder)) {
                new Notice(t(this.getLanguage(), "noticeOrganizeFolderMissing", { path: outputDir }));
                return;
            }

            const files = folder.children.filter(
                (child): child is TFile => child instanceof TFile && child.extension.toLowerCase() === "md"
            );
            if (files.length === 0) {
                clearProgress();
                new Notice(t(this.getLanguage(), "noticeOrganizeNoFiles"));
                return;
            }

            updateProgress(t(this.getLanguage(), "noticeOrganizePreparing", { count: String(files.length) }));
            const fileNames = files.map((file) => file.name);
            const prompt = this.buildOrganizationPrompt(fileNames);
            updateProgress(t(this.getLanguage(), "noticeOrganizeWaitingForLlm", { count: String(files.length) }));
            const response = await generateWithAI({
                provider: this.settings.modelProvider,
                apiKey: this.settings.deepseekApiKey,
                baseUrl: this.settings.deepseekBaseUrl,
                model: this.settings.deepseekModel,
                prompt,
            });
            updateProgress(t(this.getLanguage(), "noticeOrganizeParsing"));
            const assignments = this.parseOrganizationPlan(response, fileNames);
            updateProgress(t(this.getLanguage(), "noticeOrganizeAwaitingConfirmation", { count: String(assignments.length) }));

            new WordOrganizationModal(this.app, this.getLanguage(), assignments, async () => {
                try {
                    updateProgress(t(this.getLanguage(), "noticeOrganizeMoving", { count: String(assignments.length) }));
                    await this.applyOrganizationPlan(outputDir, assignments, (current, total) => {
                        updateProgress(t(this.getLanguage(), "noticeOrganizeMoved", {
                            current: String(current),
                            total: String(total),
                        }));
                    });
                } catch (error) {
                    console.error("Applying word organization plan failed", error);
                    clearProgress();
                    new Notice(t(this.getLanguage(), "noticeOrganizeFailed", {
                        error: error instanceof Error ? error.message : String(error),
                    }));
                }
            }, clearProgress).open();
        } catch (error) {
            console.error("Word organization failed", error);
            clearProgress();
            this.debugLog("Word organization failed", {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            new Notice(t(this.getLanguage(), "noticeOrganizeFailed", {
                error: error instanceof Error ? error.message : String(error),
            }));
        }
    }

    private buildOrganizationPrompt(fileNames: string[]): string {
        const fileList = fileNames.map((fileName) => `- ${fileName}`).join("\n");
        const template = this.settings.organizePromptTemplate.trim() || DEFAULT_SETTINGS.organizePromptTemplate;
        const renderedTemplate = template.replace(/\{\{fileNames\}\}/g, fileList);
        return [
            renderedTemplate,
            renderedTemplate.includes(fileList) ? "" : `All filenames in this directory:\n${fileList}`,
            "Create subfolder names only; do not include the root output directory, file extensions, or path traversal.",
            "Every filename must appear exactly once in the assignments. Do not invent or omit filenames.",
            "Return JSON only in this exact shape: {\"assignments\":[{\"file\":\"word.md\",\"folder\":\"Emotions\"}] }.",
        ].join("\n\n");
    }

    private parseOrganizationPlan(response: string, fileNames: string[]): WordOrganizationAssignment[] {
        const jsonText = response.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const start = jsonText.indexOf("{");
        const end = jsonText.lastIndexOf("}");
        if (start < 0 || end <= start) {
            throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
        }

        const parsed: unknown = JSON.parse(jsonText.slice(start, end + 1));
        if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { assignments?: unknown }).assignments)) {
            throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
        }

        const knownFiles = new Set(fileNames);
        const assignedFiles = new Set<string>();
        const assignments: WordOrganizationAssignment[] = [];
        for (const item of (parsed as { assignments: unknown[] }).assignments) {
            if (!item || typeof item !== "object") {
                throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
            }
            const assignment = item as { file?: unknown; folder?: unknown };
            if (typeof assignment.file !== "string" || typeof assignment.folder !== "string") {
                throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
            }
            const file = assignment.file.trim();
            const folder = this.normalizeOrganizationFolder(assignment.folder);
            if (!knownFiles.has(file) || assignedFiles.has(file) || !folder) {
                throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
            }
            assignedFiles.add(file);
            assignments.push({ file, folder });
        }

        if (assignedFiles.size !== knownFiles.size) {
            throw new Error(t(this.getLanguage(), "organizeInvalidPlan"));
        }
        return assignments;
    }

    private normalizeOrganizationFolder(folder: string): string {
        const normalized = folder.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        const parts = normalized.split("/").filter(Boolean);
        if (!parts.length || parts.some((part) => part === "." || part === "..")) {
            return "";
        }
        return parts.join("/");
    }

    private async applyOrganizationPlan(
        outputDir: string,
        assignments: WordOrganizationAssignment[],
        onMoveProgress: (current: number, total: number) => void
    ): Promise<void> {
        const normalizedOutputDir = normalizePath(outputDir).replace(/\/+$/, "");
        const currentFolder = this.app.vault.getAbstractFileByPath(normalizedOutputDir);
        if (!(currentFolder instanceof TFolder)) {
            throw new Error(t(this.getLanguage(), "noticeOrganizeFolderMissing", { path: normalizedOutputDir }));
        }

        const moves = assignments.map((assignment) => {
            const sourcePath = normalizePath(`${outputDir}/${assignment.file}`);
            const targetPath = normalizePath(`${outputDir}/${assignment.folder}/${assignment.file}`);
            if (
                !this.isPathWithinDirectory(sourcePath, normalizedOutputDir) ||
                !this.isPathWithinDirectory(targetPath, normalizedOutputDir)
            ) {
                throw new Error(t(this.getLanguage(), "organizeOutOfScope"));
            }

            const source = this.app.vault.getAbstractFileByPath(sourcePath);
            if (!(source instanceof TFile)) {
                throw new Error(t(this.getLanguage(), "organizeFileMissing", { file: assignment.file }));
            }
            const existing = this.app.vault.getAbstractFileByPath(targetPath);
            if (existing && targetPath !== sourcePath) {
                throw new Error(t(this.getLanguage(), "organizeTargetExists", { file: assignment.file }));
            }
            return { source, targetPath };
        });

        for (const [index, move] of moves.entries()) {
            await this.ensureFolder(move.targetPath.slice(0, move.targetPath.lastIndexOf("/")));
            if (move.source.path !== move.targetPath) {
                await this.app.vault.rename(move.source, move.targetPath);
            }
            onMoveProgress(index + 1, moves.length);
        }
        new Notice(t(this.getLanguage(), "noticeOrganizeSaved", { count: String(assignments.length) }));
    }

    private isPathWithinDirectory(filePath: string, directoryPath: string): boolean {
        const normalizedFilePath = normalizePath(filePath).replace(/^\/+|\/+$/g, "");
        const normalizedDirectoryPath = normalizePath(directoryPath).replace(/^\/+|\/+$/g, "");
        return normalizedFilePath.startsWith(`${normalizedDirectoryPath}/`);
    }

    private normalizeSelectedTextForAi(selectedText: string): string {
        const trimmed = selectedText.trim();

        const markdownLinkMatch = trimmed.match(/^\[([^\]]+)\]\([^)]*\)$/);
        if (markdownLinkMatch?.[1]) {
            return markdownLinkMatch[1].trim();
        }

        const wikiLinkMatch = trimmed.match(/^\[\[(.+)\]\]$/);
        if (!wikiLinkMatch) {
            return trimmed;
        }

        const captured = wikiLinkMatch[1];
        if (!captured) {
            return "";
        }

        const inner = captured.trim();
        if (!inner) {
            return "";
        }

        const aliasPartRaw = inner.includes("|") ? inner.split("|").pop() : inner;
        const aliasPart = aliasPartRaw?.trim() ?? "";
        if (!aliasPart) {
            return "";
        }

        const withoutHeading = aliasPart.split("#")[0] ?? "";
        const withoutBlock = withoutHeading.split("^")[0] ?? "";
        return withoutBlock.trim();
    }

    private captureSelectionSnapshot(editor: Editor): SelectionSnapshot | undefined {
        const currentSelection = editor.getSelection();
        const trimmedSelection = currentSelection.trim();

        if (!trimmedSelection) {
            return undefined;
        }

        return {
            from: editor.getCursor("from"),
            to: editor.getCursor("to"),
            selectedText: trimmedSelection,
        };
    }

    private wrapSelectionWithWikiLink(
        editor: Editor | undefined,
        selectionSnapshot: SelectionSnapshot | undefined,
        selectedText: string,
        outputFilePath: string
    ): void {
        if (!editor || !selectionSnapshot) {
            this.debugLog("Skip wikilink wrap because editor or selection snapshot is missing");
            return;
        }

        const originalRangeText = editor.getRange(selectionSnapshot.from, selectionSnapshot.to);
        if (!originalRangeText) {
            this.debugLog("Skip wikilink wrap because original range is empty");
            return;
        }

        const trimmedSelection = originalRangeText.trim();
        if (!trimmedSelection || trimmedSelection !== selectedText) {
            this.debugLog("Skip wikilink wrap because selection changed", {
                expected: selectedText,
                actual: trimmedSelection,
            });
            return;
        }

        if (/^\[\[[^\]]+\]\]$/.test(trimmedSelection)) {
            this.debugLog("Skip wikilink wrap because text is already linked", { selectedText: trimmedSelection });
            return;
        }

        if (this.isSelectionAlreadyInsideWikiLink(editor, selectionSnapshot.from, selectionSnapshot.to)) {
            this.debugLog("Skip wikilink wrap because selection is already inside an existing wikilink");
            return;
        }

        if (this.isSelectionInsideMarkdownLink(editor, selectionSnapshot.from, selectionSnapshot.to)) {
            this.debugLog("Skip wikilink wrap because selection is inside an existing markdown link");
            return;
        }

        const leadingWhitespace = originalRangeText.match(/^\s*/)?.[0] ?? "";
        const trailingWhitespace = originalRangeText.match(/\s*$/)?.[0] ?? "";
        const linkTarget = this.toWikiLinkTarget(outputFilePath);
        const wrapped = `${leadingWhitespace}[[${linkTarget}|${trimmedSelection}]]${trailingWhitespace}`;
        editor.replaceRange(wrapped, selectionSnapshot.from, selectionSnapshot.to);
        this.debugLog("Applied wikilink wrap", { linkedText: trimmedSelection });
    }

    private toWikiLinkTarget(outputFilePath: string): string {
        return outputFilePath.endsWith(".md")
            ? outputFilePath.slice(0, -3)
            : outputFilePath;
    }

    private isSelectionAlreadyInsideWikiLink(
        editor: Editor,
        from: EditorPosition,
        to: EditorPosition
    ): boolean {
        if (from.line !== to.line) {
            return false;
        }

        const line = editor.getLine(from.line);
        const before = line.slice(0, from.ch);
        const after = line.slice(to.ch);
        return before.endsWith("[[") && after.startsWith("]]");
    }

    private isSelectionInsideMarkdownLink(
        editor: Editor,
        from: EditorPosition,
        to: EditorPosition
    ): boolean {
        if (from.line !== to.line) {
            return false;
        }

        const line = editor.getLine(from.line);
        const linkPattern = /\[[^\]]+\]\([^\)]+\)/g;
        let match: RegExpExecArray | null;

        while ((match = linkPattern.exec(line)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            if (from.ch >= start && to.ch <= end) {
                return true;
            }
        }

        return false;
    }

    private async writeDeepSeekResult(
        selectedText: string,
        result: string,
        sourceFilePath?: string
    ): Promise<string> {
        const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results");
        await this.ensureFolder(outputDir);

        const filePath = this.getBaseOutputPath(outputDir, selectedText);
        const existing = this.app.vault.getAbstractFileByPath(filePath);

        if (existing instanceof TFile) {
            const appendedBlock = this.buildAppendBlock(result);
            await this.app.vault.append(existing, appendedBlock);
            this.debugLog("Appended AI result to existing note", { filePath });
            return filePath;
        }

        const content = this.buildInitialContent(result);
        await this.app.vault.create(filePath, content);
        this.debugLog("Created new AI note", { filePath });
        return filePath;
    }

	private async removeLinksForDeletedAiNote(deletedFile: TFile): Promise<void> {
		const wordNotesDir = this.settings.wordNotesDir.trim();
		if (!wordNotesDir) {
			return;
		}

		try {
			const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results");
			if (!deletedFile.path.startsWith(`${outputDir}/`)) {
				return;
			}
			const updatedFiles = await removeDeletedAiNoteLinks(
				this.app.vault,
				deletedFile,
				wordNotesDir
			);
			this.debugLog("Removed links to deleted AI note", {
				deletedFilePath: deletedFile.path,
				updatedFiles,
			});
		} catch (error) {
			console.error("Removing links to deleted AI note failed", error);
		}
	}

	private async cleanMissingAiNoteLinks(): Promise<void> {
		const wordNotesDir = this.settings.wordNotesDir.trim();
		if (!wordNotesDir) {
			new Notice(t(this.getLanguage(), "noticeWordNotesDirRequired"));
			return;
		}

		try {
			const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results");
			const updatedFiles = await removeMissingAiNoteLinks(
				this.app.vault,
				wordNotesDir,
				outputDir
			);
			new Notice(t(this.getLanguage(), "noticeMissingAiLinksCleaned", {
				count: String(updatedFiles),
			}));
		} catch (error) {
			console.error("Cleaning missing AI note links failed", error);
			new Notice(t(this.getLanguage(), "noticeMissingAiLinksCleanupFailed", {
				error: error instanceof Error ? error.message : String(error),
			}));
		}
	}

    private buildInitialContent(result: string): string {
        const tags = this.parseDefaultTags(this.settings.deepseekDefaultTags);

        if (tags.length > 0) {
            const frontmatterTags = tags.map((tag) => `"${tag}"`).join(", ");
            return [
                "---",
                `tags: [${frontmatterTags}]`,
                "---",
                "",
                result,
                "",
            ].join("\n");
        }

        return [
            result,
            "",
        ].join("\n");
    }

    private parseDefaultTags(input: string): string[] {
        return input
            .split(/[\s,]+/)
            .map((tag) => tag.trim().replace(/^#/, ""))
            .filter((tag) => tag.length > 0)
            .filter((tag, index, arr) => arr.indexOf(tag) === index);
    }

    private buildAppendBlock(result: string): string {
        return [
            "",
            "",
            "---",
            "",
            `${new Date().toLocaleString()}`,
            "",
            result,
            "",
        ].join("\n");
    }

    private resolveOutputDir(configuredDir: string): string {
        const raw = configuredDir.trim();
        if (!raw) {
            return "deepseek-results";
        }

        if (raw.startsWith("./") || raw.startsWith("../")) {
			throw new Error(t(this.getLanguage(), "outputRelativePathNotAllowed"));
        }

        return this.normalizeVaultPath(raw);
    }

    private normalizeVaultPath(inputPath: string): string {
        const normalized = normalizePath(inputPath).replace(/^\/+/, "");
        const parts = normalized.split("/");
        const stack: string[] = [];

        for (const part of parts) {
            if (!part || part === ".") {
                continue;
            }

            if (part === "..") {
                if (!stack.length) {
                    throw new Error(t(this.getLanguage(), "outputOutOfVaultError"));
                }
                stack.pop();
                continue;
            }

            stack.push(part);
        }

        if (!stack.length) {
            throw new Error(t(this.getLanguage(), "outputEmptyError"));
        }

        return stack.join("/");
    }

    private getBaseOutputPath(outputDir: string, selectedText: string): string {
        const safeWord = selectedText
            .replace(/[\\/:*?"<>|]/g, "-")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40) || "deepseek";
        return normalizePath(`${outputDir}/${safeWord}.md`);
    }

    private async ensureFolder(folderPath: string): Promise<void> {
        const normalized = normalizePath(folderPath).replace(/^\/+|\/+$/g, "");
        if (!normalized) {
            return;
        }

        const parts = normalized.split("/").filter(Boolean);
        let currentPath = "";

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const existing = this.app.vault.getAbstractFileByPath(currentPath);
            if (!existing) {
                await this.app.vault.createFolder(currentPath);
                continue;
            }

            if (!(existing instanceof TFolder)) {
                throw new Error(t(this.getLanguage(), "pathConflictError", { path: currentPath }));
            }
        }
    }

    private getLanguage() {
        return resolveLanguage(this.settings.uiLanguage);
    }

    private debugLog(message: string, details?: Record<string, unknown>): void {
        if (!this.settings.debugLogging) {
            return;
        }

        if (details) {
            console.log(`[Etymology Fetch][debug] ${message}`, details);
            return;
        }

        console.log(`[Etymology Fetch][debug] ${message}`);
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
