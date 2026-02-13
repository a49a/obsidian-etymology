import { App, Modal } from "obsidian";
import type { EtymologyResult } from "../etymonline";

export class EtymologyResultModal extends Modal {
	private readonly result: EtymologyResult;

	constructor(app: App, result: EtymologyResult) {
		super(app);
		this.result = result;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("etymology-result-modal");

		contentEl.createEl("h2", {
			text: this.result.title ?? this.result.term,
		});

		const link = contentEl.createEl("a", {
			text: "查看原始页面",
			href: this.result.url,
		});
		link.setAttr("target", "_blank");
		link.setAttr("rel", "noopener");

		if (this.result.definitions.length === 0) {
			contentEl.createEl("p", {
				text: "未能解析到词源内容，请查看原始页面。",
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
