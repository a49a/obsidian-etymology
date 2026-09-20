import {
	App,
	Component,
	MarkdownRenderer,
	TFile,
	TFolder,
	normalizePath,
} from "obsidian";
import { t, type ResolvedLanguage } from "../i18n";

const ANKI_EXPORT_FILE_NAME = "anki-cards.txt";

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

interface AnkiCard {
	front: string;
	backHtml: string;
	tags: string[];
	deck: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

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

function flattenHtmlForAnki(html: string): string {
	// Anki text import is line-based, so every field must collapse to one
	// line. Preformatted blocks are protected from whitespace collapsing and
	// get their newlines turned into <br> instead. The sentinels use
	// private-use characters that never occur in rendered notes.
	const preBlocks: string[] = [];
	const withoutPre = html.replace(/<pre[\s\S]*?<\/pre>/gi, (match) => {
		preBlocks.push(match.replace(/\r?\n/g, "<br>"));
		return `\uE000${preBlocks.length - 1}\uE001`;
	});

	const flattened = withoutPre
		.replace(/[\t\n\r]+/g, " ")
		.replace(/ {2,}/g, " ")
		.trim();

	return flattened.replace(/\uE000(\d+)\uE001/g, (_, index) =>
		preBlocks[Number(index)] ?? ""
	);
}

function splitFrontmatter(content: string): { body: string; tags: string[] } {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match?.[1]) {
		return { body: content.trim(), tags: [] };
	}
	return {
		body: content.slice(match[0].length).trim(),
		tags: parseFrontmatterTags(match[1]),
	};
}

function parseFrontmatterTags(frontmatter: string): string[] {
	for (const line of frontmatter.split(/\r?\n/)) {
		const tagsMatch = line.match(/^tags:\s*(.*)$/i);
		if (!tagsMatch) {
			continue;
		}

		const raw = (tagsMatch[1] ?? "").trim().replace(/^\[/, "").replace(/\]$/, "");
		if (!raw) {
			return [];
		}
		return raw
			.split(/\s*,\s*|\s+/)
			.map((tag) => tag.trim().replace(/^["']|["']$/g, "").replace(/^#/, ""))
			.filter(Boolean);
	}
	return [];
}

function buildDeckName(deckRoot: string, outputDir: string, filePath: string): string {
	const normalizedOutputDir = outputDir.replace(/^\/+|\/+$/g, "");
	const relativePath = filePath.startsWith(`${normalizedOutputDir}/`)
		? filePath.slice(normalizedOutputDir.length + 1)
		: filePath;
	const parentDirs = relativePath.split("/").slice(0, -1).filter(Boolean);
	const parts = [deckRoot, ...parentDirs].map((part) =>
		part.replace(/"/g, "'").trim()
	).filter(Boolean);
	return parts.join("::") || deckRoot;
}

function buildAnkiImportFile(cards: AnkiCard[]): string {
	const header = [
		"#separator:tab",
		"#html:true",
		"#tags column:3",
		"#deck column:4",
	];
	const rows = cards.map((card) =>
		[card.front, card.backHtml, card.tags.join(" "), card.deck]
			.map(escapeAnkiField)
			.join("\t")
	);
	return `${[...header, ...rows].join("\n")}\n`;
}

function escapeAnkiField(value: string): string {
	return value.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}
