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
	providerGlm: string;
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
	organizePromptName: string;
	organizePromptDesc: string;
	organizePromptPlaceholder: string;
	defaultTagsName: string;
	defaultTagsDesc: string;
	defaultTagsPlaceholder: string;
	aiWriteModeName: string;
	aiWriteModeDesc: string;
	aiWriteModeAppend: string;
	aiWriteModeOverwrite: string;
	aiTimeoutName: string;
	aiTimeoutDesc: string;
	ankiDeckNameName: string;
	ankiDeckNameDesc: string;
	outputDirName: string;
	outputDirDesc: string;
	wordNotesDirName: string;
	wordNotesDirDesc: string;
	lookupCommandName: string;
	aiCommandName: string;
	debugCommandName: string;
	lookupMenuName: string;
	aiMenuName: string;
	organizeWordsCommandName: string;
	cleanMissingAiLinksCommandName: string;
	ankiCommandName: string;
	organizeModalTitle: string;
	organizeModalDesc: string;
	organizeConfirm: string;
	organizeCancel: string;
	noticeSelectTextForLookup: string;
	noticeLookupInProgress: string;
	noticeLookupFailed: string;
	noticeSelectTextForAi: string;
	noticeMissingApiKey: string;
	noticeAiPreparing: string;
	noticeAiWaitingForLlm: string;
	noticeAiResponseReceived: string;
	noticeAiWritingFile: string;
	noticeAiUpdatingLink: string;
	noticeAiSaved: string;
	noticeAiFailed: string;
	noticeNoDebugSnapshot: string;
	noticeOrganizeFolderMissing: string;
	noticeOrganizeNoFiles: string;
	noticeOrganizeScanning: string;
	noticeOrganizePreparing: string;
	noticeOrganizeWaitingForLlm: string;
	noticeOrganizeParsing: string;
	noticeOrganizeAwaitingConfirmation: string;
	noticeOrganizeMoving: string;
	noticeOrganizeMoved: string;
	noticeOrganizeFailed: string;
	noticeOrganizeSaved: string;
	noticeWordNotesDirRequired: string;
	noticeMissingAiLinksCleaned: string;
	noticeMissingAiLinksCleanupFailed: string;
	noticeAnkiFolderMissing: string;
	noticeAnkiNoFiles: string;
	noticeAnkiScanning: string;
	noticeAnkiConverting: string;
	noticeAnkiSaved: string;
	noticeAnkiFailed: string;
	organizeInvalidPlan: string;
	organizeOutOfScope: string;
	organizeFileMissing: string;
	organizeTargetExists: string;
	outputOutOfVaultError: string;
	outputRelativePathNotAllowed: string;
	outputEmptyError: string;
	pathConflictError: string;
	resultViewSource: string;
	resultEmpty: string;
	debugModalTitle: string;
	debugModalMeta: string;
	debugModalSelectedText: string;
	debugModalPrompt: string;
	debugModalResponse: string;
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
	providerGlm: "智谱 GLM",
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
	modelDesc: "例如 deepseek-chat、gpt-4o-mini、glm-4-flash、claude-3-5-sonnet-latest、gemini-1.5-flash。",
	promptTemplateName: "Prompt 模板",
	promptTemplateDesc: "可使用变量 {{word}} 或 {{selectedText}}。",
	promptTemplatePlaceholder: "输入发送给模型的提示词模板",
	organizePromptName: "单词目录规划 Prompt",
	organizePromptDesc: "用于根据文件名规划 GRE 意群目录。必须保留 {{fileNames}}，它会被替换为当前目录中的文件名。",
	organizePromptPlaceholder: "输入单词目录规划 Prompt",
	defaultTagsName: "默认 tags",
	defaultTagsDesc: "生成新文件时写入 Frontmatter tags。支持逗号或空格分隔，例如 vocab,english。",
	defaultTagsPlaceholder: "vocab,english",
	aiWriteModeName: "同名笔记处理方式",
	aiWriteModeDesc: "生成的笔记已存在时，选择追加到原文之后（保留历史生成），或覆盖原文。",
	aiWriteModeAppend: "追加（默认）",
	aiWriteModeOverwrite: "覆盖",
	aiTimeoutName: "AI 请求超时时间（秒）",
	aiTimeoutDesc: "超过该时长未返回结果将中止请求并提示错误，避免界面一直等待。设为 0 表示不限制。",
	ankiDeckNameName: "Anki 牌组名称",
	ankiDeckNameDesc:
		"导出 Anki 卡片时的目标牌组名，可用 :: 表示层级（例如 GRE::词汇）。留空时使用输出目录名。",
	outputDirName: "输出目录",
	outputDirDesc:
		"相对 Vault 根目录的目录，例如 AI/StudyNotes。不支持以 ./ 或 ../ 开头的路径。",
	wordNotesDirName: "单词笔记目录",
	wordNotesDirDesc:
		"删除 AI 学习笔记时，在此目录及其子目录中将指向该笔记的 [[链接]] 还原为普通文字。路径相对 Vault 根目录。",
	lookupCommandName: "查找选中单词的词源 (Etymonline)",
	aiCommandName: "发送选中文本到 AI 并生成文件",
	debugCommandName: "查看最近一次 AI 调试信息 / Show last AI debug snapshot",
	lookupMenuName: "查找选中单词的词源 (Etymonline)",
	aiMenuName: "发送选中文本到 AI 并生成文件",
	organizeWordsCommandName: "按 GRE 意群整理 AI 单词目录",
	cleanMissingAiLinksCommandName: "清理失效 Wiki 链接",
	ankiCommandName: "把输出目录笔记导出为 Anki 卡片文件",
	organizeModalTitle: "确认单词目录规划",
	organizeModalDesc: "LLM 已为 {count} 个单词生成目录规划，请确认后移动文件。",
	organizeConfirm: "确认移动",
	organizeCancel: "取消",
	noticeSelectTextForLookup: "请先选中一个单词或短语再执行词源查找。",
	noticeLookupInProgress: "正在查找 \"{text}\" 的词源...",
	noticeLookupFailed: "词源查询失败，请稍后重试。",
	noticeSelectTextForAi: "请先选中一个单词或短语再执行 AI 生成。",
	noticeMissingApiKey: "请先在插件设置中填写 API Key。",
	noticeAiPreparing: "步骤 1/5：正在准备发送 \"{text}\" 的请求...",
	noticeAiWaitingForLlm: "步骤 2/5：正在等待 LLM 返回结果（模型响应较慢时请耐心等待）...",
	noticeAiResponseReceived: "步骤 3/5：已收到 LLM 返回，正在处理内容...",
	noticeAiWritingFile: "步骤 4/5：正在写入 AI 生成文件...",
	noticeAiUpdatingLink: "步骤 5/5：正在更新笔记链接...",
	noticeAiSaved: "AI 结果已保存: {path}",
	noticeAiFailed: "AI 生成失败：{error}。请检查 API Key、网络、Base URL 或模型设置。",
	noticeNoDebugSnapshot: "暂无可查看的 AI 调试记录，请先执行一次 AI 生成。",
	noticeOrganizeFolderMissing: "输出目录不存在或不是目录：{path}",
	noticeOrganizeNoFiles: "输出目录中没有可整理的 Markdown 文件。",
	noticeOrganizeScanning: "步骤 1/6：正在扫描单词目录...",
	noticeOrganizePreparing: "步骤 2/6：已找到 {count} 个单词，正在准备 Prompt...",
	noticeOrganizeWaitingForLlm: "步骤 3/6：正在等待 LLM 返回目录规划（文件较多时可能需要较长时间）...",
	noticeOrganizeParsing: "步骤 4/6：LLM 已返回，正在解析并校验目录规划...",
	noticeOrganizeAwaitingConfirmation: "步骤 5/6：规划完成，共 {count} 个文件，请在弹窗中确认移动...",
	noticeOrganizeMoving: "步骤 6/6：正在创建目录并移动 {count} 个文件...",
	noticeOrganizeMoved: "步骤 6/6：已移动 {current}/{total} 个文件...",
	noticeOrganizeFailed: "单词目录整理失败：{error}",
	noticeOrganizeSaved: "已按规划整理 {count} 个单词文件。",
	noticeWordNotesDirRequired: "请先在插件设置中填写单词笔记目录。",
	noticeMissingAiLinksCleaned: "已清理 {count} 个笔记中的失效 Wiki 链接。",
	noticeMissingAiLinksCleanupFailed: "清理失效 AI 链接失败：{error}",
	noticeAnkiFolderMissing: "输出目录不存在或不是目录：{path}",
	noticeAnkiNoFiles: "输出目录中没有可导出的 Markdown 文件。",
	noticeAnkiScanning: "正在扫描输出目录...",
	noticeAnkiConverting: "正在转换 {current}/{total} 个笔记...",
	noticeAnkiSaved: "已导出 {cards} 张卡片（来自 {files} 个笔记）到 {path}。在 Anki 中选择 文件→导入 打开该文件即可。",
	noticeAnkiFailed: "Anki 导出失败：{error}",
	organizeInvalidPlan: "LLM 返回的目录规划无效，未移动任何文件。",
	organizeOutOfScope: "目录规划包含输出目录之外的路径，未移动任何文件。",
	organizeFileMissing: "待整理文件不存在：{file}",
	organizeTargetExists: "目标文件已存在，未执行移动：{file}",
	outputOutOfVaultError: "输出路径超出了 Vault 范围，请调整输出目录设置。",
	outputRelativePathNotAllowed: "输出目录必须相对 Vault 根目录，不能以 ./ 或 ../ 开头。",
	outputEmptyError: "输出路径为空，请调整输出目录设置。",
	pathConflictError: "路径冲突，{path} 不是目录。",
	resultViewSource: "查看原始页面",
	resultEmpty: "未能解析到词源内容，请查看原始页面。",
	debugModalTitle: "最近一次 AI 调试信息",
	debugModalMeta: "时间 / 提供商 / 模型",
	debugModalSelectedText: "选中文本",
	debugModalPrompt: "Prompt",
	debugModalResponse: "返回内容",
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
	providerGlm: "Zhipu GLM",
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
	modelDesc: "Examples: deepseek-chat, gpt-4o-mini, glm-4-flash, claude-3-5-sonnet-latest, gemini-1.5-flash.",
	promptTemplateName: "Prompt template",
	promptTemplateDesc: "You can use {{word}} or {{selectedText}}.",
	promptTemplatePlaceholder: "Enter the prompt template sent to the model",
	organizePromptName: "Word organization prompt",
	organizePromptDesc: "Used to plan GRE semantic folders from filenames. Keep {{fileNames}}; it is replaced with the current filenames.",
	organizePromptPlaceholder: "Enter the word organization prompt",
	defaultTagsName: "Default tags",
	defaultTagsDesc: "Written to frontmatter tags when creating a new file. Supports comma or space separators, e.g. vocab,english.",
	defaultTagsPlaceholder: "vocab,english",
	aiWriteModeName: "Existing note handling",
	aiWriteModeDesc: "When a generated note already exists, append the new result to it (keeps history) or overwrite it.",
	aiWriteModeAppend: "Append (default)",
	aiWriteModeOverwrite: "Overwrite",
	aiTimeoutName: "AI request timeout (seconds)",
	aiTimeoutDesc: "Abort the request with an error after this many seconds instead of waiting forever. Set 0 to disable.",
	ankiDeckNameName: "Anki deck name",
	ankiDeckNameDesc:
		"Target deck for exported Anki cards. Use :: for hierarchy (e.g. GRE::Vocabulary). Defaults to the output directory name.",
	outputDirName: "Output directory",
	outputDirDesc:
		"A directory relative to the vault root, e.g. AI/StudyNotes. Paths starting with ./ or ../ are not supported.",
	wordNotesDirName: "Word notes directory",
	wordNotesDirDesc:
		"When an AI study note is deleted, links to it in this folder and its subfolders are converted to plain text. Path is relative to the vault root.",
	lookupCommandName: "Lookup etymology of selected text (Etymonline)",
	aiCommandName: "Send selected text to AI and create note",
	debugCommandName: "Show last AI debug snapshot / 查看最近一次 AI 调试信息",
	lookupMenuName: "Lookup etymology of selected text (Etymonline)",
	aiMenuName: "Send selected text to AI and create note",
	organizeWordsCommandName: "Organize AI word notes by GRE semantic groups",
	cleanMissingAiLinksCommandName: "Clean broken wikilinks",
	ankiCommandName: "Export output-directory notes as Anki cards",
	organizeModalTitle: "Confirm word-folder plan",
	organizeModalDesc: "The LLM planned folders for {count} words. Confirm before moving files.",
	organizeConfirm: "Move files",
	organizeCancel: "Cancel",
	noticeSelectTextForLookup: "Please select a word or phrase before etymology lookup.",
	noticeLookupInProgress: "Looking up etymology for \"{text}\"...",
	noticeLookupFailed: "Etymology lookup failed. Please try again later.",
	noticeSelectTextForAi: "Please select a word or phrase before AI generation.",
	noticeMissingApiKey: "Please set API Key in plugin settings first.",
	noticeAiPreparing: "Step 1/5: Preparing the request for \"{text}\"...",
	noticeAiWaitingForLlm: "Step 2/5: Waiting for the LLM response. This may take a while...",
	noticeAiResponseReceived: "Step 3/5: LLM response received. Processing the content...",
	noticeAiWritingFile: "Step 4/5: Writing the generated AI note...",
	noticeAiUpdatingLink: "Step 5/5: Updating the note link...",
	noticeAiSaved: "AI result saved: {path}",
	noticeAiFailed: "AI generation failed: {error}. Check API key, network, Base URL, or model settings.",
	noticeNoDebugSnapshot: "No AI debug snapshot yet. Run an AI generation first.",
	noticeOrganizeFolderMissing: "The output directory does not exist or is not a folder: {path}",
	noticeOrganizeNoFiles: "No Markdown files found in the output directory.",
	noticeOrganizeScanning: "Step 1/6: Scanning the word directory...",
	noticeOrganizePreparing: "Step 2/6: Found {count} words. Preparing the prompt...",
	noticeOrganizeWaitingForLlm: "Step 3/6: Waiting for the LLM folder plan. This may take a while for large lists...",
	noticeOrganizeParsing: "Step 4/6: LLM response received. Parsing and validating the folder plan...",
	noticeOrganizeAwaitingConfirmation: "Step 5/6: Plan ready for {count} files. Confirm the move in the dialog...",
	noticeOrganizeMoving: "Step 6/6: Creating folders and moving {count} files...",
	noticeOrganizeMoved: "Step 6/6: Moved {current}/{total} files...",
	noticeOrganizeFailed: "Word-folder organization failed: {error}",
	noticeOrganizeSaved: "Organized {count} word files according to the plan.",
	noticeWordNotesDirRequired: "Set the word notes directory in plugin settings first.",
	noticeMissingAiLinksCleaned: "Cleaned broken wikilinks in {count} notes.",
	noticeMissingAiLinksCleanupFailed: "Failed to clean broken AI links: {error}",
	noticeAnkiFolderMissing: "The output directory does not exist or is not a folder: {path}",
	noticeAnkiNoFiles: "No Markdown files to export in the output directory.",
	noticeAnkiScanning: "Scanning the output directory...",
	noticeAnkiConverting: "Converting note {current}/{total}...",
	noticeAnkiSaved: "Exported {cards} cards from {files} notes to {path}. Use File → Import in Anki to open it.",
	noticeAnkiFailed: "Anki export failed: {error}",
	organizeInvalidPlan: "The LLM returned an invalid folder plan. No files were moved.",
	organizeOutOfScope: "The folder plan contains a path outside the output directory. No files were moved.",
	organizeFileMissing: "The file to organize does not exist: {file}",
	organizeTargetExists: "The target file already exists. No files were moved: {file}",
	outputOutOfVaultError: "The output path is outside your vault. Please adjust output directory.",
	outputRelativePathNotAllowed: "The output directory must be relative to the vault root and cannot start with ./ or ../.",
	outputEmptyError: "The output path is empty. Please adjust output directory.",
	pathConflictError: "Path conflict: {path} is not a folder.",
	resultViewSource: "View original page",
	resultEmpty: "No etymology content was parsed. Please check the original page.",
	debugModalTitle: "Last AI debug snapshot",
	debugModalMeta: "Time / Provider / Model",
	debugModalSelectedText: "Selected text",
	debugModalPrompt: "Prompt",
	debugModalResponse: "Response",
};

const DICTS: Record<ResolvedLanguage, I18nDict> = {
	zh: ZH,
	en: EN,
};

export { DICTS };

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
	for (const paramKey in params) {
		if (!Object.prototype.hasOwnProperty.call(params, paramKey)) {
			continue;
		}
		const value = params[paramKey];
		text = text.split(`{${paramKey}}`).join(value);
	}
	return text;
}
