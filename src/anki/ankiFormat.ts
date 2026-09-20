export const ANKI_EXPORT_FILE_NAME = "anki-cards.txt";

export interface AnkiCard {
	front: string;
	backHtml: string;
	tags: string[];
	deck: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function splitFrontmatter(content: string): { body: string; tags: string[] } {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match?.[1]) {
		return { body: content.trim(), tags: [] };
	}
	return {
		body: content.slice(match[0].length).trim(),
		tags: parseFrontmatterTags(match[1]),
	};
}

export function parseFrontmatterTags(frontmatter: string): string[] {
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

export function flattenHtmlForAnki(html: string): string {
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

export function buildDeckName(deckRoot: string, outputDir: string, filePath: string): string {
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

export function buildAnkiImportFile(cards: AnkiCard[]): string {
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

export function escapeAnkiField(value: string): string {
	return value.replace(/[\t\r\n]+/g, " ").trim();
}
