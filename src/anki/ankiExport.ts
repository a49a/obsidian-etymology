import {
	App,
	Component,
	MarkdownRenderer,
	TFile,
	TFolder,
	normalizePath,
} from "obsidian";
import { t, type ResolvedLanguage } from "../i18n";
import {
	ANKI_EXPORT_FILE_NAME,
	buildAnkiImportFile,
	buildDeckName,
	flattenHtmlForAnki,
	splitFrontmatter,
	type AnkiCard,
} from "./ankiFormat";

export interface AnkiExportOptions {
	app: App;
	outputDir: string;
	deckRoot: string;
	component: Component;
	language: ResolvedLanguage;
	debugLog?: (message: string, details?: Record<string, unknown>) => void;
	onProgress?: (message: string) => void;
}

export interface AnkiExportResult {
	fileCount: number;
	cardCount: number;
	outputPath: string;
}

export async function exportAnkiCards(options: AnkiExportOptions): Promise<AnkiExportResult> {
	const { app, outputDir, deckRoot, component, language } = options;
	const debugLog = options.debugLog ?? (() => {});
	const onProgress = options.onProgress ?? (() => {});

	const folder = app.vault.getAbstractFileByPath(outputDir);
	if (!(folder instanceof TFolder)) {
		throw new Error(t(language, "noticeAnkiFolderMissing", { path: outputDir }));
	}

	const files = collectMarkdownFiles(folder).sort((a, b) => a.path.localeCompare(b.path));
	if (!files.length) {
		throw new Error(t(language, "noticeAnkiNoFiles"));
	}

	const cards: AnkiCard[] = [];
	for (const [index, file] of files.entries()) {
		onProgress(t(language, "noticeAnkiConverting", {
			current: String(index + 1),
			total: String(files.length),
		}));

		const content = await app.vault.read(file);
		const { body, tags } = splitFrontmatter(content);
		if (!body) {
			debugLog("Skipped note without body during Anki export", { filePath: file.path });
			continue;
		}

		cards.push({
			front: file.basename,
			backHtml: await renderMarkdownToHtml(app, component, body, file.path),
			tags,
			deck: buildDeckName(deckRoot, outputDir, file.path),
		});
	}

	const outputPath = normalizePath(`${outputDir}/${ANKI_EXPORT_FILE_NAME}`);
	const fileContent = buildAnkiImportFile(cards);
	const existing = app.vault.getAbstractFileByPath(outputPath);
	if (existing instanceof TFile) {
		await app.vault.modify(existing, fileContent);
	} else {
		await app.vault.create(outputPath, fileContent);
	}
	debugLog("Wrote Anki import file", {
		outputPath,
		cardCount: cards.length,
		fileCount: files.length,
	});

	return {
		fileCount: files.length,
		cardCount: cards.length,
		outputPath,
	};
}

function collectMarkdownFiles(folder: TFolder): TFile[] {
	const files: TFile[] = [];
	for (const child of folder.children) {
		if (child instanceof TFolder) {
			files.push(...collectMarkdownFiles(child));
		} else if (child instanceof TFile && child.extension.toLowerCase() === "md") {
			files.push(child);
		}
	}
	return files;
}

async function renderMarkdownToHtml(
	app: App,
	component: Component,
	markdown: string,
	sourcePath: string
): Promise<string> {
	const container = document.createElement("div");
	await MarkdownRenderer.render(app, markdown, container, sourcePath, component);
	return flattenHtmlForAnki(container.innerHTML);
}
