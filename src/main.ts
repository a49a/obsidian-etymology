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
import { EtymologyResultModal } from "./ui/resultModal";
import { EtymologySettingTab } from "./ui/settingsTab";

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

export default class EtymologyLookupPlugin extends Plugin {
    settings!: EtymologyPluginSettings;
    private isAiGenerating = false;
    private lastGeneration?: LastGenerationRecord;

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
                await this.handleDeepSeekForSelection(
                    selectedText,
                    this.app.workspace.getActiveFile()?.path,
                    editor,
                    selectionSnapshot,
                    "command"
                );
            },
        });

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor) => {
                this.addLookupMenuItem(menu, () => editor.getSelection().trim());
                this.addDeepSeekMenuItem(menu, editor, () => editor.getSelection().trim());
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
                    await this.handleDeepSeekForSelection(
                        selectedText,
                        this.app.workspace.getActiveFile()?.path,
                        editor,
                        selectionSnapshot,
                        "menu"
                    );
                });
        });
    }

    private async handleDeepSeekForSelection(
        selectedText: string,
        sourceFilePath?: string,
        editor?: Editor,
        selectionSnapshot?: SelectionSnapshot,
        triggerSource: TriggerSource = "command"
    ): Promise<void> {
        this.debugLog("AI command triggered", {
            triggerSource,
            sourceFilePath: sourceFilePath ?? "",
            selectedTextLength: selectedText.length,
        });

        if (this.isAiGenerating) {
            this.debugLog("Skipped because generation is already running", { triggerSource });
            new Notice(t(this.getLanguage(), "noticeAiAlreadyRunning"));
            return;
        }

        if (!selectedText) {
            new Notice(t(this.getLanguage(), "noticeSelectTextForAi"));
            return;
        }

        if (!this.settings.deepseekApiKey) {
            this.debugLog("Skipped because API key is empty", { triggerSource });
            new Notice(t(this.getLanguage(), "noticeMissingApiKey"));
            return;
        }

        this.isAiGenerating = true;

        try {
            new Notice(t(this.getLanguage(), "noticeAiInProgress", { text: selectedText }));

            const prompt = buildDeepSeekPrompt(
                this.settings.deepseekPromptTemplate,
                selectedText
            );

            const generatedText = await generateWithAI({
                provider: this.settings.modelProvider,
                apiKey: this.settings.deepseekApiKey,
                baseUrl: this.settings.deepseekBaseUrl,
                model: this.settings.deepseekModel,
                prompt,
            });
            this.debugLog("AI response received", {
                triggerSource,
                provider: this.settings.modelProvider,
                generatedTextLength: generatedText.length,
            });

            const generationKey = `${sourceFilePath ?? ""}|${selectedText}|${generatedText}`;
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
                new Notice(t(this.getLanguage(), "noticeAiSaved", { path: this.lastGeneration.filePath }));
                return;
            }

            const outputFilePath = await this.writeDeepSeekResult(selectedText, prompt, generatedText, sourceFilePath);
            this.debugLog("Created AI result file", { triggerSource, outputFilePath });
            this.lastGeneration = {
                key: generationKey,
                filePath: outputFilePath,
                createdAt: now,
            };
            this.wrapSelectionWithWikiLink(editor, selectionSnapshot, selectedText);
            new Notice(t(this.getLanguage(), "noticeAiSaved", { path: outputFilePath }));
        } catch (error) {
            console.error("AI generation failed", error);
            this.debugLog("AI generation failed", {
                triggerSource,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            new Notice(t(this.getLanguage(), "noticeAiFailed"));
        } finally {
            this.isAiGenerating = false;
        }
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
        selectedText: string
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

        const leadingWhitespace = originalRangeText.match(/^\s*/)?.[0] ?? "";
        const trailingWhitespace = originalRangeText.match(/\s*$/)?.[0] ?? "";
        const wrapped = `${leadingWhitespace}[[${trimmedSelection}]]${trailingWhitespace}`;
        editor.replaceRange(wrapped, selectionSnapshot.from, selectionSnapshot.to);
        this.debugLog("Applied wikilink wrap", { linkedText: trimmedSelection });
    }

    private async writeDeepSeekResult(
        selectedText: string,
        prompt: string,
        result: string,
        sourceFilePath?: string
    ): Promise<string> {
        const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results", sourceFilePath);
        await this.ensureFolder(outputDir);

        const filePath = this.getBaseOutputPath(outputDir, selectedText);
        const existing = this.app.vault.getAbstractFileByPath(filePath);

        if (existing instanceof TFile) {
            const appendedBlock = this.buildAppendBlock(prompt, result);
            await this.app.vault.append(existing, appendedBlock);
            this.debugLog("Appended AI result to existing note", { filePath });
            return filePath;
        }

        const content = this.buildInitialContent(selectedText, prompt, result);
        await this.app.vault.create(filePath, content);
        this.debugLog("Created new AI note", { filePath });
        return filePath;
    }

    private buildInitialContent(selectedText: string, prompt: string, result: string): string {
        return [
            `# ${selectedText}`,
            "",
            t(this.getLanguage(), "markdownPromptHeading"),
            "",
            prompt,
            "",
            t(this.getLanguage(), "markdownResultHeading"),
            "",
            result,
            "",
        ].join("\n");
    }

    private buildAppendBlock(prompt: string, result: string): string {
        return [
            "",
            "",
            "---",
            "",
            `${t(this.getLanguage(), "markdownResultHeading")} (${new Date().toLocaleString()})`,
            "",
            result,
            "",
            t(this.getLanguage(), "markdownPromptHeading"),
            "",
            prompt,
            "",
        ].join("\n");
    }

    private resolveOutputDir(configuredDir: string, sourceFilePath?: string): string {
        const raw = configuredDir.trim();
        if (!raw) {
            return "deepseek-results";
        }

        const isNoteRelative = raw.startsWith("./") || raw.startsWith("../");
        const combined = isNoteRelative
            ? `${this.getParentDir(sourceFilePath)}/${raw}`
            : raw;

        return this.normalizeVaultPath(combined);
    }

    private getParentDir(filePath?: string): string {
        if (!filePath) {
            throw new Error(t(this.getLanguage(), "outputMissingFileError"));
        }

        const normalized = normalizePath(filePath);
        const parts = normalized.split("/");
        parts.pop();
        return parts.join("/");
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
            .replace(/\s+/g, "-")
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