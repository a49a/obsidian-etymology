import { normalizePath, TFile, type MetadataCache, type Vault } from "obsidian";

const WIKI_LINK_PATTERN = /(!?)\[\[([^\]\r\n]+)\]\]/g;

/**
 * Converts links to a deleted AI note back to their visible text. This keeps the
 * surrounding word note readable while removing the now-broken wikilink.
 */
export async function removeDeletedAiNoteLinks(
	vault: Vault,
	deletedFile: TFile,
	wordNotesDir: string
): Promise<number> {
	const wordFiles = getCandidateWordFiles(vault, wordNotesDir);
	let updatedFiles = 0;

	for (const wordFile of wordFiles) {
		const content = await vault.read(wordFile);
		let changed = false;
		const updatedContent = content.replace(WIKI_LINK_PATTERN, (wholeLink, embed, inner: string) => {
			const target = getLinkTarget(inner);
			const destinationPath = normalizePath(target.endsWith(".md") ? target : `${target}.md`);

			if (destinationPath !== deletedFile.path) {
				return wholeLink;
			}

			changed = true;
			return embed ? "" : getVisibleText(inner);
		});

		if (changed) {
			await vault.modify(wordFile, updatedContent);
			updatedFiles += 1;
		}
	}

	return updatedFiles;
}

/** Removes broken wikilinks whose targets no longer exist in the vault. */
export async function removeMissingAiNoteLinks(
	vault: Vault,
	metadataCache: MetadataCache,
	wordNotesDir: string
): Promise<number> {
	const wordFiles = getCandidateWordFiles(vault, wordNotesDir);
	let updatedFiles = 0;

	for (const wordFile of wordFiles) {
		const content = await vault.read(wordFile);
		let changed = false;
		const updatedContent = content.replace(WIKI_LINK_PATTERN, (wholeLink, embed, inner: string) => {
			const target = getLinkTarget(inner);
			if (!target) {
				return wholeLink;
			}

			if (metadataCache.getFirstLinkpathDest(target, wordFile.path)) {
				return wholeLink;
			}

			changed = true;
			return embed ? "" : getVisibleText(inner);
		});

		if (changed) {
			await vault.modify(wordFile, updatedContent);
			updatedFiles += 1;
		}
	}

	return updatedFiles;
}

function getCandidateWordFiles(vault: Vault, wordNotesDir: string): TFile[] {
	const normalizedDirectory = normalizePath(wordNotesDir).replace(/^\/+|\/+$/g, "");
	const directoryPrefix = `${normalizedDirectory}/`;
	return vault.getMarkdownFiles().filter((file) => file.path.startsWith(directoryPrefix));
}

function getLinkTarget(inner: string): string {
	return inner.split("|")[0]?.split("#")[0]?.split("^")[0]?.trim() ?? "";
}

function getVisibleText(inner: string): string {
	const alias = inner.split("|")[1]?.trim();
	if (alias) {
		return alias;
	}

	const target = getLinkTarget(inner);
	return target.split("/").pop() ?? target;
}
