import { describe, expect, it } from "vitest";
import {
	getBaseOutputPath,
	isPathWithinDirectory,
	normalizeSlashes,
	normalizeVaultPath,
	resolveOutputDir,
	toWikiLinkTarget,
} from "./paths";

describe("normalizeSlashes", () => {
	it("converts backslashes and collapses duplicate slashes", () => {
		expect(normalizeSlashes("a\\b//c/d")).toBe("a/b/c/d");
	});

	it("strips leading and trailing slashes", () => {
		expect(normalizeSlashes("/folder/sub/")).toBe("folder/sub");
	});
});

describe("normalizeVaultPath", () => {
	it("resolves parent segments", () => {
		expect(normalizeVaultPath("a/b/../c", "en")).toBe("a/c");
	});

	it("throws when escaping the vault root", () => {
		expect(() => normalizeVaultPath("../outside", "en")).toThrow();
	});

	it("throws on an empty result", () => {
		expect(() => normalizeVaultPath(".", "en")).toThrow();
	});
});

describe("resolveOutputDir", () => {
	it("falls back to the default directory", () => {
		expect(resolveOutputDir("", "en")).toBe("deepseek-results");
		expect(resolveOutputDir("  ", "en")).toBe("deepseek-results");
	});

	it("normalizes a configured directory", () => {
		expect(resolveOutputDir("GRE/Words/", "en")).toBe("GRE/Words");
	});

	it("rejects relative prefixes", () => {
		expect(() => resolveOutputDir("./notes", "en")).toThrow();
		expect(() => resolveOutputDir("../notes", "en")).toThrow();
	});
});

describe("isPathWithinDirectory", () => {
	it("accepts nested paths", () => {
		expect(isPathWithinDirectory("out/sub/word.md", "out")).toBe(true);
	});

	it("rejects sibling prefixes that only share characters", () => {
		expect(isPathWithinDirectory("out2/word.md", "out")).toBe(false);
		expect(isPathWithinDirectory("elsewhere/word.md", "out")).toBe(false);
	});

	it("treats an empty directory as the vault root", () => {
		expect(isPathWithinDirectory("anything/word.md", "")).toBe(true);
	});
});

describe("getBaseOutputPath", () => {
	it("sanitizes characters that are invalid in file names", () => {
		expect(getBaseOutputPath("out", 'a/b:c*d?"e<f>g|h')).toBe("out/a-b-c-d--e-f-g-h.md");
	});

	it("collapses whitespace and truncates long words", () => {
		expect(getBaseOutputPath("out", "  hello   world  ")).toBe("out/hello world.md");
		expect(getBaseOutputPath("out", "x".repeat(60)).length).toBeLessThanOrEqual("out/".length + 40 + 3);
	});

	it("falls back to a default name when nothing usable remains", () => {
		expect(getBaseOutputPath("out", "")).toBe("out/deepseek.md");
		expect(getBaseOutputPath("out", "   ")).toBe("out/deepseek.md");
	});
});

describe("toWikiLinkTarget", () => {
	it("strips the markdown extension", () => {
		expect(toWikiLinkTarget("out/word.md")).toBe("out/word");
		expect(toWikiLinkTarget("out/word.txt")).toBe("out/word.txt");
	});
});
