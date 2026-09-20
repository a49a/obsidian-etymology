import type { Editor, EditorPosition } from "obsidian";
import { toWikiLinkTarget } from "./paths";

export interface SelectionSnapshot {
	from: EditorPosition;
	to: EditorPosition;
	selectedText: string;
}

export function captureSelectionSnapshot(editor: Editor): SelectionSnapshot | undefined {
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

export function normalizeSelectedTextForAi(selectedText: string): string {
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

export function wrapSelectionWithWikiLink(
	editor: Editor | undefined,
	selectionSnapshot: SelectionSnapshot | undefined,
	selectedText: string,
	outputFilePath: string,
	debugLog: (message: string, details?: Record<string, unknown>) => void
): void {
	if (!editor || !selectionSnapshot) {
		debugLog("Skip wikilink wrap because editor or selection snapshot is missing");
		return;
	}

	const originalRangeText = editor.getRange(selectionSnapshot.from, selectionSnapshot.to);
	if (!originalRangeText) {
		debugLog("Skip wikilink wrap because original range is empty");
		return;
	}

	const trimmedSelection = originalRangeText.trim();
	if (!trimmedSelection || trimmedSelection !== selectedText) {
		debugLog("Skip wikilink wrap because selection changed", {
			expected: selectedText,
			actual: trimmedSelection,
		});
		return;
	}

	if (/^\[\[[^\]]+\]\]$/.test(trimmedSelection)) {
		debugLog("Skip wikilink wrap because text is already linked", { selectedText: trimmedSelection });
		return;
	}

	if (isSelectionAlreadyInsideWikiLink(editor, selectionSnapshot.from, selectionSnapshot.to)) {
		debugLog("Skip wikilink wrap because selection is already inside an existing wikilink");
		return;
	}

	if (isSelectionInsideMarkdownLink(editor, selectionSnapshot.from, selectionSnapshot.to)) {
		debugLog("Skip wikilink wrap because selection is inside an existing markdown link");
		return;
	}

	const leadingWhitespace = originalRangeText.match(/^\s*/)?.[0] ?? "";
	const trailingWhitespace = originalRangeText.match(/\s*$/)?.[0] ?? "";
	const linkTarget = toWikiLinkTarget(outputFilePath);
	const wrapped = `${leadingWhitespace}[[${linkTarget}|${trimmedSelection}]]${trailingWhitespace}`;
	editor.replaceRange(wrapped, selectionSnapshot.from, selectionSnapshot.to);
	debugLog("Applied wikilink wrap", { linkedText: trimmedSelection });
}

function isSelectionAlreadyInsideWikiLink(
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

function isSelectionInsideMarkdownLink(
	editor: Editor,
	from: EditorPosition,
	to: EditorPosition
): boolean {
	if (from.line !== to.line) {
		return false;
	}

	const line = editor.getLine(from.line);
	const linkPattern = /\[[^\]]+\]\([^)]+\)/g;
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
