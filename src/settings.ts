export type UiLanguage = "auto" | "zh" | "en";
export type ModelProvider = "deepseek" | "openai" | "anthropic" | "gemini" | "custom";

export interface ProviderPreset {
	baseUrl: string;
	model: string;
}

export const PROVIDER_PRESETS: Record<ModelProvider, ProviderPreset> = {
	deepseek: {
		baseUrl: "https://api.deepseek.com",
		model: "deepseek-chat",
	},
	openai: {
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-4o-mini",
	},
	anthropic: {
		baseUrl: "https://api.anthropic.com/v1/messages",
		model: "claude-3-5-sonnet-latest",
	},
	gemini: {
		baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
		model: "gemini-1.5-flash",
	},
	custom: {
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-4o-mini",
	},
};

export interface EtymologyPluginSettings {
	uiLanguage: UiLanguage;
	modelProvider: ModelProvider;
	debugLogging: boolean;
	deepseekApiKey: string;
	deepseekBaseUrl: string;
	deepseekModel: string;
	deepseekPromptTemplate: string;
	deepseekOutputDir: string;
}

export const DEFAULT_SETTINGS: EtymologyPluginSettings = {
	uiLanguage: "auto",
	modelProvider: "deepseek",
	debugLogging: false,
	deepseekApiKey: "",
	deepseekBaseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
	deepseekModel: PROVIDER_PRESETS.deepseek.model,
	deepseekPromptTemplate:
		"请根据下面的单词生成学习笔记，输出 Markdown 格式，包含词义、词根词缀、例句和记忆建议。\n\n单词：{{word}}",
	deepseekOutputDir: "deepseek-results",
};

export function getPresetForProvider(provider: ModelProvider): ProviderPreset {
	return PROVIDER_PRESETS[provider];
}

export function buildDeepSeekPrompt(template: string, selectedWord: string): string {
	return template
		.replace(/\{\{word\}\}/g, selectedWord)
		.replace(/\{\{selectedText\}\}/g, selectedWord);
}
