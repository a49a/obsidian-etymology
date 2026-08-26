import { App, Modal } from "obsidian";
import { t, type ResolvedLanguage } from "../i18n";

export interface LastAiDebugSnapshot {
	provider: string;
	model: string;
	selectedText: string;
	prompt: string;
	response: string;
	timestamp: number;
}

export class DebugResultModal extends Modal {
	private readonly language: ResolvedLanguage;
	private readonly snapshot: LastAiDebugSnapshot;

	constructor(app: App, language: ResolvedLanguage, snapshot: LastAiDebugSnapshot) {
		super(app);
		this.language = language;
		this.snapshot = snapshot;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: t(this.language, "debugModalTitle") });
		contentEl.createEl("p", {
			text: `${t(this.language, "debugModalMeta")}: ${new Date(this.snapshot.timestamp).toLocaleString()} | ${this.snapshot.provider} | ${this.snapshot.model}`,
		});
		contentEl.createEl("p", { text: `${t(this.language, "debugModalSelectedText")}: ${this.snapshot.selectedText}` });

		contentEl.createEl("h3", { text: t(this.language, "debugModalPrompt") });
		contentEl.createEl("pre", { text: this.snapshot.prompt || "" });

		contentEl.createEl("h3", { text: t(this.language, "debugModalResponse") });
		contentEl.createEl("pre", { text: this.snapshot.response || "" });
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
