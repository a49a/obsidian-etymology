import type { UiLanguage } from "./settings";

export type ResolvedLanguage = "zh" | "en";

type I18nDict = {
	settingsTitle: string;
	languageName: string;
	languageDesc: string;
	languageAuto: string;
	languageZh: string;
	languageEn: string;
	providerName: string;
	providerDesc: string;
	providerDeepseek: string;
	providerOpenai: string;
	providerAnthropic: string;
	providerGemini: string;
	providerCustom: string;
	debugLoggingName: string;
	debugLoggingDesc: string;
	apiKeyName: string;
	apiKeyDesc: string;
	baseUrlName: string;
	baseUrlDesc: string;
	modelName: string;
	modelDesc: string;
	promptTemplateName: string;
	promptTemplateDesc: string;
	promptTemplatePlaceholder: string;
	outputDirName: string;
	outputDirDesc: string;
	lookupCommandName: string;
	aiCommandName: string;
	lookupMenuName: string;
	aiMenuName: string;
	noticeSelectTextForLookup: string;
	noticeLookupInProgress: string;
	noticeLookupFailed: string;
	noticeSelectTextForAi: string;
	noticeMissingApiKey: string;
	noticeAiAlreadyRunning: string;
	noticeAiInProgress: string;
	noticeAiSaved: string;
	noticeAiFailed: string;
	outputMissingFileError: string;
	outputOutOfVaultError: string;
	outputEmptyError: string;
	pathConflictError: string;
	resultViewSource: string;
	resultEmpty: string;
	markdownPromptHeading: string;
	markdownResultHeading: string;
};

const ZH: I18nDict = {
	settingsTitle: "AI 设置",
	languageName: "界面语言",
	languageDesc: "用于插件设置与提示文案。",
	languageAuto: "自动（跟随系统）",
	languageZh: "中文",
	languageEn: "English",
	providerName: "模型提供商",
	providerDesc: "切换后会自动填入推荐的 Base URL 和模型名，可再手动调整。",
	providerDeepseek: "DeepSeek",
	providerOpenai: "OpenAI",
	providerAnthropic: "Anthropic (Claude)",
	providerGemini: "Google Gemini",
	providerCustom: "自定义（OpenAI 兼容）",
	debugLoggingName: "调试日志",
	debugLoggingDesc: "开启后在开发者控制台输出详细执行日志，用于排查问题。",
	apiKeyName: "API Key",
	apiKeyDesc: "用于调用所选模型提供商 API。",
	baseUrlName: "Base URL",
	baseUrlDesc: "API 基础地址。不同提供商格式不同。",
	modelName: "模型名",
	modelDesc: "例如 deepseek-chat、gpt-4o-mini、claude-3-5-sonnet-latest、gemini-1.5-flash。",
	promptTemplateName: "Prompt 模板",
	promptTemplateDesc: "可使用变量 {{word}} 或 {{selectedText}}。",
	promptTemplatePlaceholder: "输入发送给模型的提示词模板",
	outputDirName: "输出目录",
	outputDirDesc:
		"默认相对 Vault 根目录；以 ./ 或 ../ 开头时相对当前笔记目录，例如 ./ai-results。",
	lookupCommandName: "查找选中单词的词源 (Etymonline)",
	aiCommandName: "发送选中文本到 AI 并生成文件",
	lookupMenuName: "查找选中单词的词源 (Etymonline)",
	aiMenuName: "发送选中文本到 AI 并生成文件",
	noticeSelectTextForLookup: "请先选中一个单词或短语再执行词源查找。",
	noticeLookupInProgress: "正在查找 \"{text}\" 的词源...",
	noticeLookupFailed: "词源查询失败，请稍后重试。",
	noticeSelectTextForAi: "请先选中一个单词或短语再执行 AI 生成。",
	noticeMissingApiKey: "请先在插件设置中填写 API Key。",
	noticeAiAlreadyRunning: "AI 生成正在进行中，请稍候。",
	noticeAiInProgress: "正在将 \"{text}\" 发送到 AI...",
	noticeAiSaved: "AI 结果已保存: {path}",
	noticeAiFailed: "AI 生成失败，请检查 API Key、网络、Base URL 或模型设置。",
	outputMissingFileError:
		"未找到当前文件。使用 ./ 或 ../ 输出路径时，请在一个已保存的笔记中执行命令。",
	outputOutOfVaultError: "输出路径超出了 Vault 范围，请调整输出目录设置。",
	outputEmptyError: "输出路径为空，请调整输出目录设置。",
	pathConflictError: "路径冲突，{path} 不是目录。",
	resultViewSource: "查看原始页面",
	resultEmpty: "未能解析到词源内容，请查看原始页面。",
	markdownPromptHeading: "## Prompt",
	markdownResultHeading: "## AI 返回",
};

const EN: I18nDict = {
	settingsTitle: "AI Settings",
	languageName: "Language",
	languageDesc: "Used for plugin settings and notices.",
	languageAuto: "Auto (follow system)",
	languageZh: "Chinese",
	languageEn: "English",
	providerName: "Model provider",
	providerDesc: "When changed, recommended Base URL and model are auto-filled. You can still edit them.",
	providerDeepseek: "DeepSeek",
	providerOpenai: "OpenAI",
	providerAnthropic: "Anthropic (Claude)",
	providerGemini: "Google Gemini",
	providerCustom: "Custom (OpenAI-compatible)",
	debugLoggingName: "Debug logging",
	debugLoggingDesc: "When enabled, detailed execution logs are printed to the developer console.",
	apiKeyName: "API Key",
	apiKeyDesc: "Required for the selected model provider API.",
	baseUrlName: "Base URL",
	baseUrlDesc: "API base URL. Format differs by provider.",
	modelName: "Model",
	modelDesc: "Examples: deepseek-chat, gpt-4o-mini, claude-3-5-sonnet-latest, gemini-1.5-flash.",
	promptTemplateName: "Prompt template",
	promptTemplateDesc: "You can use {{word}} or {{selectedText}}.",
	promptTemplatePlaceholder: "Enter the prompt template sent to the model",
	outputDirName: "Output directory",
	outputDirDesc:
		"By default it's relative to vault root. If it starts with ./ or ../, it's relative to the current note folder, e.g. ./ai-results.",
	lookupCommandName: "Lookup etymology of selected text (Etymonline)",
	aiCommandName: "Send selected text to AI and create note",
	lookupMenuName: "Lookup etymology of selected text (Etymonline)",
	aiMenuName: "Send selected text to AI and create note",
	noticeSelectTextForLookup: "Please select a word or phrase before etymology lookup.",
	noticeLookupInProgress: "Looking up etymology for \"{text}\"...",
	noticeLookupFailed: "Etymology lookup failed. Please try again later.",
	noticeSelectTextForAi: "Please select a word or phrase before AI generation.",
	noticeMissingApiKey: "Please set API Key in plugin settings first.",
	noticeAiAlreadyRunning: "AI generation is already in progress. Please wait.",
	noticeAiInProgress: "Sending \"{text}\" to AI...",
	noticeAiSaved: "AI result saved: {path}",
	noticeAiFailed: "AI generation failed. Check API key, network, Base URL, or model settings.",
	outputMissingFileError:
		"Current file not found. When using ./ or ../ output paths, run the command in a saved note.",
	outputOutOfVaultError: "The output path is outside your vault. Please adjust output directory.",
	outputEmptyError: "The output path is empty. Please adjust output directory.",
	pathConflictError: "Path conflict: {path} is not a folder.",
	resultViewSource: "View original page",
	resultEmpty: "No etymology content was parsed. Please check the original page.",
	markdownPromptHeading: "## Prompt",
	markdownResultHeading: "## AI Result",
};

const DICTS: Record<ResolvedLanguage, I18nDict> = {
	zh: ZH,
	en: EN,
};

export function resolveLanguage(language: UiLanguage): ResolvedLanguage {
	if (language === "zh" || language === "en") {
		return language;
	}

	const locale = (globalThis.navigator?.language ?? "").toLowerCase();
	return locale.startsWith("zh") ? "zh" : "en";
}

export function t(
	language: ResolvedLanguage,
	key: keyof I18nDict,
	params: Record<string, string> = {}
): string {
	let text = DICTS[language][key];
	for (const [paramKey, value] of Object.entries(params)) {
		text = text.split(`{${paramKey}}`).join(value);
	}
	return text;
}
