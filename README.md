# Etymology Fetch

[English](README.md) | [中文](README-zh.md)

---

Etymology Fetch is an Obsidian plugin that helps you:

- look up the etymology of selected words or phrases from Etymonline
- send selected text to AI models (DeepSeek/OpenAI/GLM/Claude/Gemini/custom)
- save the generated result as a Markdown note in your vault
- organize word notes into GRE semantic-group subfolders using an LLM plan

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

#### 3) GRE word-folder organization

- Scan Markdown word notes directly inside the configured output directory.
- Send filenames only to the selected LLM for semantic grouping.
- Review the returned folder plan before moving files.
- Validate that every file is assigned exactly once and check target conflicts.
- Restrict all planning and file moves to the configured output directory.

### Commands

- `查找选中单词的词源 (Etymonline)`
- `发送选中文本到 AI 并生成文件`
- `查看最近一次 AI 调试信息`
- `Organize AI word notes by GRE semantic groups`

The commands are available in Command Palette; the first two are also available in the editor context menu.

### AI settings

Open Obsidian Settings -> Community plugins -> Etymology Fetch.

| Setting | Description | Default |
| --- | --- | --- |
| Language | `Auto`, `Chinese`, `English` for plugin UI text. | `Auto` |
| Model provider | `DeepSeek`, `OpenAI`, `Zhipu GLM`, `Anthropic (Claude)`, `Google Gemini`, `Custom (OpenAI-compatible)` | `DeepSeek` |
| API Key | Required to call selected provider API. | empty |
| Base URL | API endpoint base URL. | provider-specific default |
| Model | Model name. | provider-specific default |
| Prompt template | Supports `{{word}}` and `{{selectedText}}`. | built-in vocabulary template |
| Word organization prompt | Prompt used to group filenames into GRE semantic folders. Keep `{{fileNames}}`; it is replaced with the current filenames. | built-in GRE grouping template |
| Default tags | Written to frontmatter `tags` when creating a new file. | empty |
| Output directory | By default relative to vault root. If path starts with `./` or `../`, it is relative to the current note folder. | `deepseek-results` |

Prompt example:

```text
Please generate a Markdown vocabulary note for the following word, including meaning, roots/affixes, example sentences, and memory tips.

Word: {{word}}
```

### Install for local testing

Quick deploy (build + copy to vault plugin folder in one command):

```bash
npm run deploy -- --vault "/path/to/YourVault"
```

Or deploy directly to a plugin directory:

```bash
npm run deploy -- --plugin-dir "/path/to/YourVault/.obsidian/plugins/etymology-fetch"
```

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

- frontmatter tags (if configured)
- AI response

#### Organize word notes

Run `Organize AI word notes by GRE semantic groups` to scan Markdown files directly inside the configured output directory. The plugin sends only their filenames to the selected LLM, asks for a strict JSON folder plan based on GRE semantic groups, shows the plan for confirmation, and then moves the files into the planned subfolders.

The organization prompt can be edited in settings. Keep the `{{fileNames}}` placeholder so the current filenames are included. The plugin appends the required JSON response and assignment constraints automatically.

Progress notices identify scanning, prompt preparation, waiting for the LLM, response validation, confirmation, and file movement. During movement, the notice shows the completed and total file counts.

The organization operation never reads or moves files outside the configured output directory. Plans containing absolute paths, parent-directory traversal, or other out-of-scope paths are rejected before any file is moved.

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

- Watch and write directly to `dist/` (for quick local plugin testing):

```bash
npm run dev:dist
```

### Privacy and network

- Etymonline lookup sends selected text to Etymonline.
- AI generation sends selected text and rendered prompt to your configured provider endpoint.
- Word organization sends filenames from the configured output directory to your configured provider endpoint; note contents are not sent.
- Generated output is saved only in your current vault.

### License

See `LICENSE`.
