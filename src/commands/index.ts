import { Notice, type Editor, type Menu } from "obsidian";
import { exportAnkiCards } from "../anki/ankiExport";
import { cleanMissingAiNoteLinks } from "../features/cleanAiNoteLinks";
import { organizeAiWordNotes } from "../features/organizeWordNotes";
import { fetchEtymology } from "../etymonline";
import { t } from "../i18n";
import type EtymologyLookupPlugin from "../main";
import { resolveOutputDir } from "../utils/paths";
import { captureSelectionSnapshot } from "../utils/selection";
import { DebugResultModal } from "../ui/debugResultModal";
import { EtymologyResultModal } from "../ui/resultModal";

export function registerCommands(plugin: EtymologyLookupPlugin): void {
	const language = plugin.getLanguage();

	plugin.addCommand({
		id: "lookup-etymology",
		name: t(language, "lookupCommandName"),
		editorCallback: (editor) => {
			const selectedText = editor.getSelection().trim();
			void runEtymologyLookup(plugin, selectedText);
		},
	});

	plugin.addCommand({
		id: "generate-deepseek-note",
		name: t(language, "aiCommandName"),
		editorCallback: (editor) => {
			enqueueAiGeneration(plugin, editor, "command");
		},
	});

	plugin.addCommand({
		id: "show-last-ai-debug-snapshot",
		name: t(language, "debugCommandName"),
		callback: () => {
			const snapshot = plugin.aiNoteService.lastDebugSnapshot;
			if (!snapshot) {
				new Notice(t(plugin.getLanguage(), "noticeNoDebugSnapshot"));
				return;
			}

			new DebugResultModal(plugin.app, plugin.getLanguage(), snapshot).open();
		},
	});

	plugin.addCommand({
		id: "organize-ai-word-notes",
		name: t(language, "organizeWordsCommandName"),
		callback: () => void organizeAiWordNotes(plugin),
	});

	plugin.addCommand({
		id: "clean-missing-ai-note-links",
		name: t(language, "cleanMissingAiLinksCommandName"),
		callback: () => void cleanMissingAiNoteLinks(plugin),
	});

	plugin.addCommand({
		id: "export-anki-cards",
		name: t(language, "ankiCommandName"),
		callback: () => void runAnkiExport(plugin),
	});

	plugin.registerEvent(
		plugin.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
			addLookupMenuItem(plugin, menu, () => editor.getSelection().trim());
			addDeepSeekMenuItem(plugin, menu, editor, () => editor.getSelection().trim());
		})
	);
}

async function runEtymologyLookup(plugin: EtymologyLookupPlugin, selectedText: string): Promise<void> {
	const language = plugin.getLanguage();
	if (!selectedText) {
		new Notice(t(language, "noticeSelectTextForLookup"));
		return;
	}

	new Notice(t(language, "noticeLookupInProgress", { text: selectedText }));

	try {
		const result = await fetchEtymology(selectedText);
		new EtymologyResultModal(plugin.app, result, language).open();
	} catch (error) {
		console.error("Etymology lookup failed", error);
		new Notice(t(language, "noticeLookupFailed"));
	}
}

function addLookupMenuItem(
	plugin: EtymologyLookupPlugin,
	menu: Menu,
	getSelection: () => string
): void {
	menu.addItem((item) => {
		item
			.setTitle(t(plugin.getLanguage(), "lookupMenuName"))
			.setIcon("book")
			.onClick(() => {
				void runEtymologyLookup(plugin, getSelection());
			});
	});
}

function addDeepSeekMenuItem(
	plugin: EtymologyLookupPlugin,
	menu: Menu,
	editor: Editor,
	getSelection: () => string
): void {
	menu.addItem((item) => {
		item
			.setTitle(t(plugin.getLanguage(), "aiMenuName"))
			.setIcon("sparkles")
			.onClick(() => {
				enqueueAiGeneration(plugin, editor, "menu", getSelection);
			});
	});
}

function enqueueAiGeneration(
	plugin: EtymologyLookupPlugin,
	editor: Editor,
	triggerSource: "command" | "menu",
	getSelection?: () => string
): void {
	const selectionSnapshot = captureSelectionSnapshot(editor);
	const selectedText = selectionSnapshot?.selectedText ?? getSelection?.() ?? "";
	plugin.aiNoteService.enqueue({
		selectedText,
		sourceFilePath: plugin.app.workspace.getActiveFile()?.path,
		editor,
		selectionSnapshot,
		triggerSource,
	});
}

async function runAnkiExport(plugin: EtymologyLookupPlugin): Promise<void> {
	const language = plugin.getLanguage();
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
		updateProgress(t(language, "noticeAnkiScanning"));
		const outputDir = resolveOutputDir(plugin.settings.deepseekOutputDir || "deepseek-results", language);
		const deckRoot = plugin.settings.ankiDeckName.trim()
			|| outputDir.split("/").pop()
			|| "Etymology Fetch";
		const result = await exportAnkiCards({
			app: plugin.app,
			outputDir,
			deckRoot,
			component: plugin,
			language,
			debugLog: (message, details) => plugin.debugLog(message, details),
			onProgress: updateProgress,
		});
		clearProgress();
		plugin.debugLog("Anki export finished", {
			outputPath: result.outputPath,
			cardCount: result.cardCount,
			fileCount: result.fileCount,
		});
		new Notice(t(language, "noticeAnkiSaved", {
			cards: String(result.cardCount),
			files: String(result.fileCount),
			path: result.outputPath,
		}));
	} catch (error) {
		console.error("Anki export failed", error);
		clearProgress();
		plugin.debugLog("Anki export failed", {
			errorMessage: error instanceof Error ? error.message : String(error),
		});
		new Notice(t(language, "noticeAnkiFailed", {
			error: error instanceof Error ? error.message : String(error),
		}));
	}
}
