# Etymology Fetch

[English](README.md) | [中文](README-zh.md)

---

Etymology Fetch 是一个 Obsidian 插件，支持：

- 查询选中文本在 Etymonline 的词源信息
- 将选中的单词或短语发送给 AI 模型（DeepSeek/OpenAI/GLM/Claude/Gemini/自定义）
- 将生成结果保存为 Vault 内的 Markdown 文件
- 使用 LLM 规划 GRE 意群，并将单词笔记整理到子目录

### 功能

#### 1）Etymonline 词源查询

- 选中单词或短语后，从 [Etymonline](https://www.etymonline.com/) 获取词源。
- 在 Obsidian 弹窗中展示解析结果。
- 可跳转到 Etymonline 原始页面。

#### 2）AI 生成学习笔记

- 将选中文本发送到你选择的 AI 提供商 API。
- 在插件设置中自定义 Prompt 模板。
- 模板支持 `{{word}}` 或 `{{selectedText}}` 变量。
- 将模型返回内容写入 Vault 内 Markdown 文件。
- 输出目录不存在时自动创建。
- 文件名默认使用选中文本（会做文件名安全处理），例如 `etymology.md`。
- 如果同名文件已存在，会自动追加序号，如 `etymology-1.md`，避免覆盖。

### 命令

- `查找选中单词的词源 (Etymonline)`
- `发送选中文本到 AI 并生成文件`
- `查看最近一次 AI 调试信息`
- `按 GRE 意群整理 AI 单词目录`

以上命令都支持命令面板和编辑器右键菜单。

### AI 设置

在 Obsidian 中打开：设置 -> 第三方插件 -> Etymology Fetch。

| 设置项 | 说明 | 默认值 |
| --- | --- | --- |
| 界面语言 | `自动`、`中文`、`English`，用于插件界面文本。 | `自动` |
| 模型提供商 | `DeepSeek`、`OpenAI`、`智谱 GLM`、`Anthropic (Claude)`、`Google Gemini`、`自定义（OpenAI 兼容）` | `DeepSeek` |
| API Key | 调用所选提供商 API 必填。 | 空 |
| Base URL | API 基础地址。 | 按提供商默认值 |
| 模型名 | 使用的模型名称。 | 按提供商默认值 |
| Prompt 模板 | 支持 `{{word}}` 和 `{{selectedText}}`。 | 内置单词学习模板 |
| 单词目录规划 Prompt | 用于按照 GRE 意群规划文件名目录。请保留 `{{fileNames}}`，插件会将它替换为当前目录中的文件名。 | 内置 GRE 意群规划模板 |
| 单词笔记目录 | 必填。输出目录中的 AI 学习笔记被删除后，插件会扫描此目录及其子目录，将指向已删除笔记的 `[[链接]]` 还原为普通文字；路径相对 Vault 根目录。 | 空 |
| 默认 tags | 新建文件时写入 frontmatter `tags`。 | 空 |
| 输出目录 | 必填。相对 Vault 根目录，不支持 `./` 或 `../`。 | `deepseek-results` |

Prompt 示例：

```text
请根据下面的单词生成学习笔记，输出 Markdown 格式，包含词义、词根词缀、例句和记忆建议。

单词：{{word}}
```

### 本地测试安装

#### 已将插件文件软链接到 `dist/`

如果 Vault 的插件目录中 `main.js`、`manifest.json` 和 `styles.css` 已软链接到本项目的 `dist/`，日常开发测试执行：

```bash
npm run dev:dist
```

该命令会持续监听源码，修改后自动更新 `dist/main.js`，并同步 `manifest.json`、`styles.css`。回到 Obsidian 后使用“重新加载应用（不重启）”或关闭再启用插件，即可测试最新代码。一次性打包测试可执行：

```bash
npm run build
```

此命令同样会将三个发布文件更新到 `dist/`，但不会持续监听文件变化。

一键部署（构建 + 复制到 Vault 插件目录）：

```bash
npm run deploy -- --vault "/path/to/YourVault"
```

或者直接指定插件目录：

```bash
npm run deploy -- --plugin-dir "/path/to/YourVault/.obsidian/plugins/etymology-fetch"
```

1. 在项目中构建插件：

```bash
npm install
npm run build
```

构建后，发布文件会自动整理到：

```text
dist/
```

也可以自定义输出目录（支持相对路径和绝对路径）：

```bash
# 相对路径（相对于项目根目录）
RELEASE_OUTPUT_DIR=release-files npm run build

# 绝对路径
RELEASE_OUTPUT_DIR=/Users/yourname/Desktop/obsidian-release npm run build
```

1. 从 `dist/` 将以下文件复制到 Vault 插件目录：

```text
<Vault>/.obsidian/plugins/etymology-fetch/
```

至少包含：

- `main.js`
- `manifest.json`
- `styles.css`

1. 在 Obsidian 的 设置 -> 第三方插件 中启用插件。

### 使用方式

#### 词源查询

1. 在笔记中选中单词或短语。
2. 执行 `查找选中单词的词源 (Etymonline)`。
3. 在弹窗中查看结果。

#### AI 生成文件

1. 先配置模型提供商和 API Key。
2. 选中单词或短语。
3. 执行 `发送选中文本到 AI 并生成文件`。
4. 在你配置的输出目录中查看生成的 Markdown 文件。

生成文件内容包括：

- frontmatter tags（如已配置）
- AI 返回内容

#### 删除 AI 学习笔记时清理链接

请填写“单词笔记目录”（例如 `GRE/Words`）和“输出目录”（例如 `AI/StudyNotes`），两者都相对 Vault 根目录。当删除输出目录中的 AI 学习笔记时，插件会在单词笔记目录及其子目录中把指向此笔记的链接还原为普通单词文本，例如将 `[[AI/StudyNotes/abate|abate]]` 改为 `abate`。仅处理 Markdown 文件。

如果在启用此功能前已删除过文件，请从命令面板执行“清理已删除 AI 学习笔记的链接”。它只清理输出目录中已经不存在的笔记链接。

#### 整理单词目录

执行 `按 GRE 意群整理 AI 单词目录` 后，插件会扫描配置的输出目录下的 Markdown 文件（只扫描当前目录，不递归扫描子目录），仅将文件名发送给所选 LLM，请它按照 GRE 常见意群返回目录规划。插件会先展示规划结果，确认后才会创建子目录并移动文件。

插件会校验每个文件名是否恰好分配一次，并在移动前检查目标文件冲突。

整个整理过程只允许在配置的 output directory 及其子目录内操作。包含绝对路径、`..` 路径穿越或其他目录外路径的规划，会在移动任何文件前被拒绝。

可以在插件设置中修改“单词目录规划 Prompt”。请保留 `{{fileNames}}` 占位符，插件会将当前文件名列表插入其中；严格 JSON 返回格式和文件分配约束会由插件自动追加。

整理过程中会显示扫描、准备 Prompt、等待 LLM、解析校验、等待确认和移动文件等阶段进度；移动文件时会显示已完成数量和总数量。

### 开发

- 建议 Node.js 18+
- 构建：

```bash
npm run build
```

- 开发监听：

```bash
npm run dev
```

- 监听并直接输出到 `dist/`（便于本地插件测试）：

```bash
npm run dev:dist
```

如果 Vault 插件目录中的三个发布文件已软链接至 `dist/`，推荐使用此命令；修改代码后在 Obsidian 中重新加载插件即可。

### 隐私与网络

- 词源查询会将选中文本发送到 Etymonline。
- AI 生成会将选中文本和渲染后的 Prompt 发送到你配置的模型提供商接口地址。
- 单词目录整理会将配置输出目录中的文件名发送到你配置的模型提供商接口，不会发送笔记内容。
- 生成结果仅写入当前 Vault。

### 许可证

详见 `LICENSE`。
