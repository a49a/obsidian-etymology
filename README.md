# Etymology Fetch

[English](#english) | [中文](#中文)

---

## English

Etymology Fetch is an Obsidian plugin that helps you:

- look up the etymology of selected words or phrases from Etymonline
- send selected text to AI models (DeepSeek/OpenAI/Claude/Gemini/custom)
- save the generated result as a Markdown note in your vault

### Features

#### 1) Etymonline lookup

- Select a word or phrase and fetch its etymology from [Etymonline](https://www.etymonline.com/).
- Show parsed results in an Obsidian modal.
- Provide a link to the original Etymonline page.

#### 2) AI note generation

- Send selected text to your selected AI provider.
- Edit your own prompt template in plugin settings.
- Use `{{word}}` or `{{selectedText}}` in the template.
- Save model output as a Markdown file in your vault.
- Auto-create output folder if it does not exist.
- File name uses the selected text (sanitized for file safety), for example `etymology.md`.
- If the file already exists, append a numeric suffix like `etymology-1.md` to avoid overwrite.

### Commands

- `查找选中单词的词源 (Etymonline)`
- `发送选中文本到 AI 并生成文件`

Both commands are available in Command Palette and editor context menu.

### AI settings

Open Obsidian Settings -> Community plugins -> Etymology Fetch.

| Setting | Description | Default |
| --- | --- | --- |
| Language | `Auto`, `Chinese`, `English` for plugin UI text. | `Auto` |
| Model provider | `DeepSeek`, `OpenAI`, `Anthropic (Claude)`, `Google Gemini`, `Custom (OpenAI-compatible)` | `DeepSeek` |
| API Key | Required to call selected provider API. | empty |
| Base URL | API endpoint base URL. | provider-specific default |
| Model | Model name. | provider-specific default |
| Prompt template | Supports `{{word}}` and `{{selectedText}}`. | built-in vocabulary template |
| Output directory | By default relative to vault root. If path starts with `./` or `../`, it is relative to the current note folder. | `deepseek-results` |

Prompt example:

```text
Please generate a Markdown vocabulary note for the following word, including meaning, roots/affixes, example sentences, and memory tips.

Word: {{word}}
```

### Install for local testing

1. Build the plugin in this project:

```bash
npm install
npm run build
```

After build, release files are prepared in:

```text
dist/
```

You can also choose a custom output directory (relative or absolute):

```bash
# Relative path (from project root)
RELEASE_OUTPUT_DIR=release-files npm run build

# Absolute path
RELEASE_OUTPUT_DIR=/Users/yourname/Desktop/obsidian-release npm run build
```

1. Copy these files from `dist/` into your vault plugin folder:

```text
<Vault>/.obsidian/plugins/etymology-fetch/
```

Required files:

- `main.js`
- `manifest.json`
- `styles.css`

1. In Obsidian, enable it from Settings -> Community plugins.

### Usage

#### Etymonline lookup

1. Select a word or phrase in a note.
2. Run `查找选中单词的词源 (Etymonline)`.
3. Read results in the modal.

#### AI file generation

1. Configure provider and API Key first.
2. Select a word or phrase.
3. Run `发送选中文本到 AI 并生成文件`.
4. Check the generated file in your configured output directory.

Generated note includes:

- selected text as title
- prompt sent to the model
- AI response

### Development

- Node.js 18+ recommended
- Build command:

```bash
npm run build
```

- Watch mode:

```bash
npm run dev
```

### Privacy and network

- Etymonline lookup sends selected text to Etymonline.
- AI generation sends selected text and rendered prompt to your configured provider endpoint.
- Generated output is saved only in your current vault.

### License

See `LICENSE`.

---

## 中文

Etymology Fetch 是一个 Obsidian 插件，支持：

- 查询选中文本在 Etymonline 的词源信息
- 将选中的单词或短语发送给 AI 模型（DeepSeek/OpenAI/Claude/Gemini/自定义）
- 将生成结果保存为 Vault 内的 Markdown 文件

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

以上命令都支持命令面板和编辑器右键菜单。

### AI 设置

在 Obsidian 中打开：设置 -> 第三方插件 -> Etymology Fetch。

| 设置项 | 说明 | 默认值 |
| --- | --- | --- |
| 界面语言 | `自动`、`中文`、`English`，用于插件界面文本。 | `自动` |
| 模型提供商 | `DeepSeek`、`OpenAI`、`Anthropic (Claude)`、`Google Gemini`、`自定义（OpenAI 兼容）` | `DeepSeek` |
| API Key | 调用所选提供商 API 必填。 | 空 |
| Base URL | API 基础地址。 | 按提供商默认值 |
| 模型名 | 使用的模型名称。 | 按提供商默认值 |
| Prompt 模板 | 支持 `{{word}}` 和 `{{selectedText}}`。 | 内置单词学习模板 |
| 输出目录 | 默认相对 Vault 根目录；如果以 `./` 或 `../` 开头，则相对当前笔记所在目录。 | `deepseek-results` |

Prompt 示例：

```text
请根据下面的单词生成学习笔记，输出 Markdown 格式，包含词义、词根词缀、例句和记忆建议。

单词：{{word}}
```

### 本地测试安装

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

- 选中文本标题
- 实际发送的 Prompt
- AI 返回内容

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

### 隐私与网络

- 词源查询会将选中文本发送到 Etymonline。
- AI 生成会将选中文本和渲染后的 Prompt 发送到你配置的模型提供商接口地址。
- 生成结果仅写入当前 Vault。

### 许可证

详见 `LICENSE`。
