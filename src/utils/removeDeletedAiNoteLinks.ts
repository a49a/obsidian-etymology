import {
	normalizePath,
	TFile,
	type MetadataCache,
	type Vault,
} from "obsidian";

const WIKI_LINK_PATTERN = /(!?)\[\[([^\]\r\n]+)\]\]/g;

/**
 * Converts links to a deleted AI note back to their visible text. This keeps the
 * surrounding word note readable while removing the now-broken wikilink.
 *
 * Candidates are pre-filtered through the metadata cache, which holds each
 * source file's parsed links in memory, so note contents are only read when
 * the cache shows a link to the deleted note.
 */
export async function removeDeletedAiNoteLinks(
	vault: Vault,
	metadataCache: MetadataCache,
	deletedFile: TFile,
	wordNotesDir: string
): Promise<number> {
	let updatedFiles = 0;

	for (const wordFile of getCandidateWordFiles(vault, wordNotesDir)) {
		if (!hasCachedLinkTo(metadataCache, wordFile, deletedFile.path)) {
			continue;
		}

		const content = await vault.read(wordFile);
		let changed = false;
		const updatedContent = content.replace(WIKI_LINK_PATTERN, (wholeLink, embed, inner: string) => {
			if (getLinkDestinationPath(inner) !== deletedFile.path) {
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

/**
 * Removes broken wikilinks whose targets no longer exist in the vault. Like
 * the deletion hook, files without any cached broken link are never read.
 */
export async function removeMissingAiNoteLinks(
	vault: Vault,
	metadataCache: MetadataCache,
	wordNotesDir: string
): Promise<number> {
	let updatedFiles = 0;

	for (const wordFile of getCandidateWordFiles(vault, wordNotesDir)) {
		if (!hasCachedBrokenLink(metadataCache, wordFile)) {
			continue;
		}

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

function hasCachedLinkTo(
	metadataCache: MetadataCache,
	file: TFile,
	destinationPath: string
): boolean {
	const cache = metadataCache.getCache(file.path);
	return (cache?.links ?? []).some((link) => getLinkDestinationPath(link.link) === destinationPath);
}

function hasCachedBrokenLink(metadataCache: MetadataCache, file: TFile): boolean {
	const cache = metadataCache.getCache(file.path);
	return (cache?.links ?? []).some((link) => {
		const target = getLinkTarget(link.link);
		return !!target && !metadataCache.getFirstLinkpathDest(target, file.path);
	});
}

export function getLinkDestinationPath(linkText: string): string {
	const target = getLinkTarget(linkText);
	return normalizePath(target.endsWith(".md") ? target : `${target}.md`);
}

export function getLinkTarget(inner: string): string {
	return inner.split("|")[0]?.split("#")[0]?.split("^")[0]?.trim() ?? "";
}

export function getVisibleText(inner: string): string {
	const alias = inner.split("|")[1]?.trim();
	if (alias) {
		return alias;
	}

	const target = getLinkTarget(inner);
	return target.split("/").pop() ?? target;
}
