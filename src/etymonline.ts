import { requestUrl } from "obsidian";

export interface EtymologyResult {
	term: string;
	url: string;
	title?: string;
	definitions: string[];
}

function extractDefinitions(doc: Document): string[] {
	const contentSections = Array.from(
		doc.querySelectorAll("section.-mt-4.-mb-2.lg\\:-mb-2")
	);

	const paragraphTexts = contentSections
		.flatMap((section) => Array.from(section.querySelectorAll("p")))
		.map((paragraph) => paragraph.textContent?.trim() ?? "")
		.filter((text) => text.length > 0);

	if (paragraphTexts.length > 0) {
		return paragraphTexts;
	}

	const sections = Array.from(doc.querySelectorAll("section")).filter((section) =>
		Array.from(section.classList).some((className) => className.startsWith("word__defination"))
	);

	const definitions = sections
		.map((section) => section.textContent?.trim() ?? "")
		.filter((text) => text.length > 0);

	if (definitions.length > 0) {
		return definitions;
	}

	const main = doc.querySelector("main") ?? doc.body;
	const fallbackText = main?.textContent?.trim();
	return fallbackText ? [fallbackText] : [];
}

export async function fetchEtymology(term: string): Promise<EtymologyResult> {
	const url = `https://www.etymonline.com/word/${encodeURIComponent(term)}`;
	const response = await requestUrl({
		url,
		headers: {
			"User-Agent": "Obsidian Etymology Lookup",
		},
	});

	const parser = new DOMParser();
	const doc = parser.parseFromString(response.text, "text/html");
	const title = doc.querySelector("h1")?.textContent?.trim();
	const definitions = extractDefinitions(doc);

	return {
		term,
		url,
		title,
		definitions,
	};
}
