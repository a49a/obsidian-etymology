import { Plugin, TFile } from "obsidian";
import { AiNoteService } from "./ai/aiNoteService";
import { registerCommands } from "./commands";
import { removeLinksForDeletedAiNote } from "./features/cleanAiNoteLinks";
import { resolveLanguage, type ResolvedLanguage } from "./i18n";
import { DEFAULT_SETTINGS, type EtymologyPluginSettings } from "./settings";
import { EtymologySettingTab } from "./ui/settingsTab";

export default class EtymologyLookupPlugin extends Plugin {
	settings!: EtymologyPluginSettings;
	aiNoteService!: AiNoteService;

	async onload() {
		await this.loadSettings();
		this.aiNoteService = new AiNoteService(this);
		this.addSettingTab(new EtymologySettingTab(this));
		registerCommands(this);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") {
					return;
				}
				void removeLinksForDeletedAiNote(this, file);
			})
		);
	}

	onunload() {
		// Everything that needs cleanup goes through this.register* helpers,
		// so Obsidian unloads it automatically.
	}

	getLanguage(): ResolvedLanguage {
		return resolveLanguage(this.settings.uiLanguage);
	}

	debugLog(message: string, details?: Record<string, unknown>): void {
		if (!this.settings.debugLogging) {
			return;
		}

		if (details) {
			console.debug(`[Etymology Fetch][debug] ${message}`, details);
			return;
		}

		console.debug(`[Etymology Fetch][debug] ${message}`);
	}

	async loadSettings(): Promise<void> {
		const savedSettings = (await this.loadData()) as Partial<EtymologyPluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
