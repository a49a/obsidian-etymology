import { describe, expect, it } from "vitest";
import { DICTS, resolveLanguage, t } from "./i18n";

describe("DICTS", () => {
	it("keeps the Chinese and English dictionaries in sync", () => {
		const zhKeys = Object.keys(DICTS.zh).sort();
		const enKeys = Object.keys(DICTS.en).sort();
		expect(zhKeys).toEqual(enKeys);
	});
});

describe("t", () => {
	it("replaces all placeholders", () => {
		const text = t("zh", "noticeAnkiConverting", { current: "3", total: "9" });
		expect(text).toBe("正在转换 3/9 个笔记...");
	});

	it("falls back to English for the en locale", () => {
		const text = t("en", "noticeLookupInProgress", { text: "abate" });
		expect(text).toBe('Looking up etymology for "abate"...');
	});
});

describe("resolveLanguage", () => {
	it("returns the explicit setting", () => {
		expect(resolveLanguage("zh")).toBe("zh");
		expect(resolveLanguage("en")).toBe("en");
	});

	it("follows the system locale for auto", () => {
		const original = globalThis.navigator;
		Object.defineProperty(globalThis, "navigator", {
			value: { language: "zh-CN" },
			configurable: true,
			writable: true,
		});
		try {
			expect(resolveLanguage("auto")).toBe("zh");
		} finally {
			Object.defineProperty(globalThis, "navigator", {
				value: original,
				configurable: true,
				writable: true,
			});
		}
	});
});
