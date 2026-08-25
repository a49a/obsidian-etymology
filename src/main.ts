// main.js
import { normalizePath, Plugin, Notice, Menu, TFolder, type Editor } from "obsidian";
import { generateWithAI } from "./deepseek";
import { fetchEtymology } from "./etymonline";
import { resolveLanguage, t } from "./i18n";
import { buildDeepSeekPrompt, DEFAULT_SETTINGS, EtymologyPluginSettings } from "./settings";
import { EtymologyResultModal } from "./ui/resultModal";
import { EtymologySettingTab } from "./ui/settingsTab";

export default class EtymologyLookupPlugin extends Plugin {
    settings!: EtymologyPluginSettings;

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
                const selectedText = editor.getSelection().trim();
                await this.handleDeepSeekForSelection(
                    selectedText,
                    this.app.workspace.getActiveFile()?.path,
                    editor
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
                    const selectedText = getSelection();
                    await this.handleDeepSeekForSelection(
                        selectedText,
                        this.app.workspace.getActiveFile()?.path,
                        editor
                    );
                });
        });
    }

    private async handleDeepSeekForSelection(
        selectedText: string,
        sourceFilePath?: string,
        editor?: Editor
    ): Promise<void> {
        if (!selectedText) {
            new Notice(t(this.getLanguage(), "noticeSelectTextForAi"));
            return;
        }

        if (!this.settings.deepseekApiKey) {
            new Notice(t(this.getLanguage(), "noticeMissingApiKey"));
            return;
        }

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

            const outputFilePath = await this.writeDeepSeekResult(selectedText, prompt, generatedText, sourceFilePath);
            this.wrapCurrentSelectionWithWikiLink(editor, selectedText);
            new Notice(t(this.getLanguage(), "noticeAiSaved", { path: outputFilePath }));
        } catch (error) {
            console.error("AI generation failed", error);
            new Notice(t(this.getLanguage(), "noticeAiFailed"));
        }
    }

    private wrapCurrentSelectionWithWikiLink(editor: Editor | undefined, selectedText: string): void {
        if (!editor) {
            return;
        }

        const currentSelection = editor.getSelection();
        if (!currentSelection) {
            return;
        }

        const trimmedSelection = currentSelection.trim();
        if (!trimmedSelection || trimmedSelection !== selectedText) {
            return;
        }

        if (/^\[\[[^\]]+\]\]$/.test(trimmedSelection)) {
            return;
        }

        editor.replaceSelection(`[[${trimmedSelection}]]`);
    }

    private async writeDeepSeekResult(
        selectedText: string,
        prompt: string,
        result: string,
        sourceFilePath?: string
    ): Promise<string> {
        const outputDir = this.resolveOutputDir(this.settings.deepseekOutputDir || "deepseek-results", sourceFilePath);
        await this.ensureFolder(outputDir);

        const filePath = this.getUniqueOutputPath(outputDir, selectedText);
        const content = [
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

        await this.app.vault.create(filePath, content);
        return filePath;
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

    private getUniqueOutputPath(outputDir: string, selectedText: string): string {
        const safeWord = selectedText
            .replace(/[\\/:*?"<>|]/g, "-")
            .replace(/\s+/g, "-")
            .slice(0, 40) || "deepseek";
        let candidatePath = normalizePath(`${outputDir}/${safeWord}.md`);
        let index = 1;

        while (this.app.vault.getAbstractFileByPath(candidatePath)) {
            candidatePath = normalizePath(`${outputDir}/${safeWord}-${index}.md`);
            index += 1;
        }

        return candidatePath;
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

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}