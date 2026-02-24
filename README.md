# Etymology Fetch | 词源查询插件

[English](#english) | [中文](#chinese)

---

## <a name="english"></a>English

### Overview

**Etymology Fetch** is an Obsidian community plugin that helps you explore the origins and history of English words directly within your notes. Simply select a word or phrase in Obsidian, and the plugin instantly fetches its etymology data from [Etymonline.com](https://www.etymonline.com), displaying comprehensive information about the word's linguistic roots.

### Features

✨ **Quick Word Lookup**
- Select any word or phrase and look up its etymology instantly
- Access via command palette or right-click context menu

📖 **Rich Etymology Data**
- Fetch comprehensive etymology information from Etymonline.com
- View word definitions and linguistic history
- Understand the origins and evolution of English words

⚡ **Seamless Integration**
- Works in both editing mode and preview mode
- Non-intrusive modal interface for viewing results
- One-click access to the full entry on Etymonline.com

🖥️ **Desktop Focus**
- Optimized for desktop use
- Efficient network requests with proper error handling

### Installation

#### Option 1: Community Plugin (Recommended)
1. Open Obsidian → **Settings** → **Community plugins**
2. Click **Browse** and search for "Etymology Fetch"
3. Click **Install** and then **Enable**

#### Option 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/yourusername/obsi-enradar/releases)
2. Extract the files into: `.obsidian/plugins/etymology-fetch/`
3. Reload Obsidian
4. Go to **Settings** → **Community plugins** and enable "Etymology Fetch"

### Usage

#### Method 1: Command Palette
1. Select a word or phrase in your note
2. Open the command palette (**Cmd+P** on Mac, **Ctrl+P** on Windows/Linux)
3. Search for "Look up etymology" and press Enter
4. The etymology details will appear in a modal window

#### Method 2: Right-Click Context Menu
1. Select a word or phrase in your note (works in both edit and preview mode)
2. Right-click to open the context menu
3. Select "Look up etymology (Etymonline)"
4. View the detailed etymology information

#### Method 3: Editor Menu
1. While editing, place your cursor or select text
2. Access the editor menu and select the etymology lookup option
3. Instantly fetch and display the word's etymology

### How It Works

1. **Selection**: Select any English word or phrase in your Obsidian vault
2. **Query**: The plugin sends a request to Etymonline.com
3. **Parsing**: Etymology and definition data is extracted from the response
4. **Display**: Results are shown in a clean modal window
5. **Link**: A direct link is provided for exploring more on Etymonline.com

### Features Explained

**Automatic Definition Extraction**
- The plugin intelligently extracts definitions and etymology information
- Handles multiple page layouts and formats from Etymonline.com
- Falls back gracefully if specific sections aren't found

**Error Handling**
- Clear notifications if a word is not found or the lookup fails
- User-friendly error messages guide you on what to do next

**Performance**
- Lightweight plugin with minimal memory footprint
- Efficient network requests
- Quick response times for word lookups

### Requirements

- **Obsidian**: Version 0.15.0 or higher
- **Internet Connection**: Required to fetch data from Etymonline.com
- **Desktop**: Currently desktop-only (Windows, macOS, Linux)

### Troubleshooting

**Plugin doesn't load**
- Make sure it's enabled in Settings → Community plugins
- Restart Obsidian if needed
- Check that your plugin folder contains `main.js` and `manifest.json`

**Word lookup fails**
- Ensure you have an active internet connection
- Etymonline.com must be accessible from your network
- Try a different word or check the word's spelling
- The word might not exist in Etymonline's database

**No results displayed**
- Some less common words may not have entries on Etymonline.com
- Try searching with the singular form or root word
- Check if the word is in the English language

### Development

This plugin is built with:
- **TypeScript**: For type-safe code
- **Obsidian API**: Official plugin development framework
- **esbuild**: For efficient bundling

To contribute or develop locally:
```bash
git clone https://github.com/yourusername/obsi-enradar.git
cd obsi-enradar
npm install
npm run dev
```

### License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

### Acknowledgments

- Built for [Obsidian](https://obsidian.md)
- Etymology data provided by [Etymonline.com](https://www.etymonline.com)
- Inspired by the Obsidian community's passion for knowledge

---

## <a name="chinese"></a>中文

### 概述

**词源查询插件（Etymology Fetch）** 是一款 Obsidian 社区插件，帮助你直接在笔记中探索英文单词的来源和历史。只需在 Obsidian 中选中一个单词或短语，插件就能立即从 [Etymonline.com](https://www.etymonline.com) 获取词源数据，并显示该单词的语言起源和演变历史。

### 功能特性

✨ **快速单词查询**
- 选中任何单词或短语，检索其词源
- 支持命令面板和右键菜单访问

📖 **丰富的词源信息**
- 从 Etymonline.com 获取全面的词源信息
- 查看单词定义和语言历史
- 理解英文单词的来源和演变过程

⚡ **无缝集成**
- 在编辑模式和预览模式下均可使用
- 简洁的模态框界面显示结果
- 一键访问 Etymonline.com 上的完整词条

🖥️ **桌面优化**
- 针对桌面使用进行了优化
- 支持高效的网络请求和错误处理

### 安装方法

#### 方法一：官方社区插件（推荐）
1. 打开 Obsidian → **设置** → **第三方插件**
2. 点击**浏览**，搜索"Etymology Fetch"
3. 点击**安装**，然后**启用**

#### 方法二：手动安装
1. 从 [GitHub 发布页面](https://github.com/yourusername/obsi-enradar/releases) 下载最新版本
2. 解压文件到：`.obsidian/plugins/etymology-fetch/`
3. 重新加载 Obsidian
4. 转到**设置** → **第三方插件**，启用"Etymology Fetch"

### 使用方法

#### 方法一：命令面板
1. 在笔记中选中一个单词或短语
2. 打开命令面板（Mac 上为 **Cmd+P**，Windows/Linux 上为 **Ctrl+P**）
3. 搜索"查找选中单词的词源"并按 Enter
4. 词源详情将在模态框中显示

#### 方法二：右键菜单
1. 在笔记中选中一个单词或短语（在编辑和预览模式下都可用）
2. 右键打开上下文菜单
3. 选择"查找选中单词的词源 (Etymonline)"
4. 查看详细的词源信息

#### 方法三：编辑菜单
1. 在编辑时，将光标放在单词上或选中文本
2. 访问编辑菜单并选择词源查询选项
3. 立即获取并显示该单词的词源

### 工作原理

1. **选择**：在 Obsidian 库中选中任何英文单词或短语
2. **查询**：插件向 Etymonline.com 发送请求
3. **解析**：从响应中提取词源和定义数据
4. **显示**：以简洁的模态框形式显示结果
5. **链接**：提供直接链接，用于在 Etymonline.com 上进行更多探索

### 功能说明

**自动定义提取**
- 插件智能地提取定义和词源信息
- 处理来自 Etymonline.com 的多种页面布局和格式
- 当找不到特定部分时，优雅地回退

**错误处理**
- 如果单词未找到或查找失败，会显示清晰的通知
- 用户友好的错误消息指导你下一步该做什么

**性能优化**
- 轻量级插件，内存占用最少
- 高效的网络请求
- 单词查询响应速度快

### 系统要求

- **Obsidian**：版本 0.15.0 或更高
- **网络连接**：需要网络连接才能从 Etymonline.com 获取数据
- **系统**：目前仅支持桌面（Windows、macOS、Linux）

### 常见问题排查

**插件无法加载**
- 确保在**设置** → **第三方插件**中已启用
- 如需要，重启 Obsidian
- 检查插件文件夹中是否包含 `main.js` 和 `manifest.json`

**单词查询失败**
- 确保你有活跃的网络连接
- Etymonline.com 必须可以从你的网络访问
- 尝试查询不同的单词或检查拼写
- 该单词可能不在 Etymonline 的数据库中

**没有显示结果**
- 某些不常见的单词在 Etymonline.com 上可能没有词条
- 尝试用单数形式或词根进行搜索
- 确认该单词是英文单词

### 开发

该插件使用以下技术栈构建：
- **TypeScript**：提供类型安全的代码
- **Obsidian API**：官方插件开发框架
- **esbuild**：高效的打包工具

本地开发或贡献：
```bash
git clone https://github.com/yourusername/obsi-enradar.git
cd obsi-enradar
npm install
npm run dev
```

### 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE)。

### 致谢

- 为 [Obsidian](https://obsidian.md) 构建
- 词源数据来自 [Etymonline.com](https://www.etymonline.com)
- 受 Obsidian 社区对知识的热情启发