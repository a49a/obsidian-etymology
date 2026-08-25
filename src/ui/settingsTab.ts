import { PluginSettingTab, Setting } from "obsidian";
import { resolveLanguage, t } from "../i18n";
import { getPresetForProvider, type ModelProvider } from "../settings";
import type EtymologyLookupPlugin from "../main";

export class EtymologySettingTab extends PluginSettingTab {
	private readonly plugin: EtymologyLookupPlugin;

	constructor(plugin: EtymologyLookupPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const language = resolveLanguage(this.plugin.settings.uiLanguage);

		containerEl.createEl("h2", { text: t(language, "settingsTitle") });

		new Setting(containerEl)
			.setName(t(language, "languageName"))
			.setDesc(t(language, "languageDesc"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("auto", t(language, "languageAuto"))
					.addOption("zh", t(language, "languageZh"))
					.addOption("en", t(language, "languageEn"))
					.setValue(this.plugin.settings.uiLanguage)
					.onChange(async (value) => {
						this.plugin.settings.uiLanguage = value as "auto" | "zh" | "en";
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t(language, "providerName"))
			.setDesc(t(language, "providerDesc"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("deepseek", t(language, "providerDeepseek"))
					.addOption("openai", t(language, "providerOpenai"))
					.addOption("anthropic", t(language, "providerAnthropic"))
					.addOption("gemini", t(language, "providerGemini"))
					.addOption("custom", t(language, "providerCustom"))
					.setValue(this.plugin.settings.modelProvider)
					.onChange(async (value) => {
						const provider = value as ModelProvider;
						this.plugin.settings.modelProvider = provider;
						const preset = getPresetForProvider(provider);
						this.plugin.settings.deepseekBaseUrl = preset.baseUrl;
						this.plugin.settings.deepseekModel = preset.model;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t(language, "apiKeyName"))
			.setDesc(t(language, "apiKeyDesc"))
			.addText((text) =>
				text
					.setPlaceholder("sk-...")
					.setValue(this.plugin.settings.deepseekApiKey)
					.onChange(async (value) => {
						this.plugin.settings.deepseekApiKey = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t(language, "baseUrlName"))
			.setDesc(t(language, "baseUrlDesc"))
			.addText((text) =>
				text
					.setPlaceholder(getPresetForProvider(this.plugin.settings.modelProvider).baseUrl)
					.setValue(this.plugin.settings.deepseekBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.deepseekBaseUrl =
							value.trim() || getPresetForProvider(this.plugin.settings.modelProvider).baseUrl;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t(language, "modelName"))
			.setDesc(t(language, "modelDesc"))
			.addText((text) =>
				text
					.setPlaceholder(getPresetForProvider(this.plugin.settings.modelProvider).model)
					.setValue(this.plugin.settings.deepseekModel)
					.onChange(async (value) => {
						this.plugin.settings.deepseekModel =
							value.trim() || getPresetForProvider(this.plugin.settings.modelProvider).model;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t(language, "promptTemplateName"))
			.setDesc(t(language, "promptTemplateDesc"))
			.addTextArea((text) => {
				text
					.setPlaceholder(t(language, "promptTemplatePlaceholder"))
					.setValue(this.plugin.settings.deepseekPromptTemplate)
					.onChange(async (value) => {
						this.plugin.settings.deepseekPromptTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.style.width = "100%";
			});

		new Setting(containerEl)
			.setName(t(language, "outputDirName"))
			.setDesc(t(language, "outputDirDesc"))
			.addText((text) =>
				text
					.setPlaceholder("deepseek-results")
					.setValue(this.plugin.settings.deepseekOutputDir)
					.onChange(async (value) => {
						this.plugin.settings.deepseekOutputDir = value.trim() || "deepseek-results";
						await this.plugin.saveSettings();
					})
			);
	}
}
