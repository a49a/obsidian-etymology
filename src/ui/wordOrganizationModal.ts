import { App, ButtonComponent, Modal } from "obsidian";
import { t, type ResolvedLanguage } from "../i18n";

export interface WordOrganizationAssignment {
	file: string;
	folder: string;
}

export class WordOrganizationModal extends Modal {
	private readonly language: ResolvedLanguage;
	private readonly assignments: WordOrganizationAssignment[];
	private readonly onConfirm: () => Promise<void>;
	private readonly onCloseCallback: () => void;

	constructor(
		app: App,
		language: ResolvedLanguage,
		assignments: WordOrganizationAssignment[],
		onConfirm: () => Promise<void>,
		onCloseCallback: () => void
	) {
		super(app);
		this.language = language;
		this.assignments = assignments;
		this.onConfirm = onConfirm;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: t(this.language, "organizeModalTitle") });
		contentEl.createEl("p", {
			text: t(this.language, "organizeModalDesc", { count: String(this.assignments.length) }),
		});

		const preview = this.assignments.map((assignment) => `${assignment.file} -> ${assignment.folder}`).join("\n");
		contentEl.createEl("pre", { text: preview });

		const buttonRow = contentEl.createDiv({ cls: "modal-button-container" });
		new ButtonComponent(buttonRow)
			.setButtonText(t(this.language, "organizeCancel"))
			.onClick(() => this.close());
		new ButtonComponent(buttonRow)
			.setButtonText(t(this.language, "organizeConfirm"))
			.setCta()
			.onClick(async () => {
				await this.onConfirm();
				this.close();
			});
	}

	onClose(): void {
		this.onCloseCallback();
		this.contentEl.empty();
	}
}