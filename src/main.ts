// main.js
import { Plugin, Notice, Menu } from "obsidian";
import { fetchEtymology } from "./etymonline";
import { EtymologyResultModal } from "./ui/resultModal";

export default class EtymologyLookupPlugin extends Plugin {
    async onload() {
        console.log('加载 Etymology Lookup Plugin');

        // 注册一个命令，用户可以通过命令面板调用
        this.addCommand({
            id: "lookup-etymology",
            name: "查找选中单词的词源 (Etymonline)",
            // 当命令被执行时，这个回调函数会被调用
            editorCallback: async (editor) => {
                // 获取当前编辑器中选中的文本，并去除首尾空格
                const selectedText = editor.getSelection().trim();

                // 如果没有选中任何文本，则显示一个提示
                if (!selectedText) {
                    new Notice("请先选中一个单词或短语再执行词源查找。");
                    return;
                }

                new Notice(`正在查找 "${selectedText}" 的词源...`);

                try {
                    const result = await fetchEtymology(selectedText);
                    new EtymologyResultModal(this.app, result).open();
                } catch (error) {
                    console.error("Etymology lookup failed", error);
                    new Notice("词源查询失败，请稍后重试。");
                }
            },
        });

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor) => {
                this.addLookupMenuItem(menu, () => editor.getSelection().trim());
            })
        );
    }

    onunload() {
        console.log('卸载 Etymology Lookup Plugin');
    }

    private addLookupMenuItem(menu: Menu, getSelection: () => string) {
        menu.addItem((item) => {
            item
                .setTitle("查找选中单词的词源 (Etymonline)")
                .setIcon("book")
                .onClick(async () => {
                    const selectedText = getSelection();
                    if (!selectedText) {
                        new Notice("请先选中一个单词或短语再执行词源查找。");
                        return;
                    }

                    new Notice(`正在查找 \"${selectedText}\" 的词源...`);
                    try {
                        const result = await fetchEtymology(selectedText);
                        new EtymologyResultModal(this.app, result).open();
                    } catch (error) {
                        console.error("Etymology lookup failed", error);
                        new Notice("词源查询失败，请稍后重试。");
                    }
                });
        });
    }
}