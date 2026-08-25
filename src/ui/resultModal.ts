import { App, Modal } from "obsidian";
import type { EtymologyResult } from "../etymonline";
import { t, type ResolvedLanguage } from "../i18n";

export class EtymologyResultModal extends Modal {
	private readonly result: EtymologyResult;
	private readonly language: ResolvedLanguage;

	constructor(app: App, result: EtymologyResult, language: ResolvedLanguage) {
		super(app);
		this.result = result;
		this.language = language;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("etymology-result-modal");

		contentEl.createEl("h2", {
			text: this.result.title ?? this.result.term,
		});

		const link = contentEl.createEl("a", {
			text: t(this.language, "resultViewSource"),
			href: this.result.url,
		});
		link.setAttr("target", "_blank");
		link.setAttr("rel", "noopener");

		if (this.result.definitions.length === 0) {
			contentEl.createEl("p", {
				text: t(this.language, "resultEmpty"),
				cls: "etymology-empty",
			});
			return;
		}

		const definitionWrap = contentEl.createEl("div", {
			cls: "etymology-definitions",
		});

		this.result.definitions.forEach((definition) => {
			const cleaned = definition.replace(/\n{3,}/g, "\n\n").trim();
			const paragraphs = cleaned.split(/\n{2,}/g).filter(Boolean);
			const block = definitionWrap.createEl("div", { cls: "etymology-definition" });
			paragraphs.forEach((paragraph) => {
				block.createEl("p", { text: paragraph.trim() });
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
