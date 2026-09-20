import { Notice, TFile } from "obsidian";
import { t } from "../i18n";
import type EtymologyLookupPlugin from "../main";
import { removeDeletedAiNoteLinks, removeMissingAiNoteLinks } from "../utils/removeDeletedAiNoteLinks";

export async function removeLinksForDeletedAiNote(
	plugin: EtymologyLookupPlugin,
	deletedFile: TFile
): Promise<void> {
	const wordNotesDir = plugin.settings.wordNotesDir.trim();
	if (!wordNotesDir) {
		return;
	}

	try {
		const updatedFiles = await removeDeletedAiNoteLinks(
			plugin.app.vault,
			deletedFile,
			wordNotesDir
		);
		plugin.debugLog("Removed links to deleted AI note", {
			deletedFilePath: deletedFile.path,
			updatedFiles,
		});
	} catch (error) {
		console.error("Removing links to deleted AI note failed", error);
	}
}

export async function cleanMissingAiNoteLinks(plugin: EtymologyLookupPlugin): Promise<void> {
	const language = plugin.getLanguage();
	const wordNotesDir = plugin.settings.wordNotesDir.trim();
	if (!wordNotesDir) {
		new Notice(t(language, "noticeWordNotesDirRequired"));
		return;
	}

	try {
		const updatedFiles = await removeMissingAiNoteLinks(
			plugin.app.vault,
			plugin.app.metadataCache,
			wordNotesDir
		);
		new Notice(t(language, "noticeMissingAiLinksCleaned", {
			count: String(updatedFiles),
		}));
	} catch (error) {
		console.error("Cleaning missing AI note links failed", error);
		new Notice(t(language, "noticeMissingAiLinksCleanupFailed", {
			error: error instanceof Error ? error.message : String(error),
		}));
	}
}
