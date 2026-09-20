import { describe, expect, it } from "vitest";
import { buildAppendBlock, buildInitialContent, parseDefaultTags } from "./noteContent";

describe("parseDefaultTags", () => {
	it("splits on commas and whitespace", () => {
		expect(parseDefaultTags("vocab, english gre")).toEqual(["vocab", "english", "gre"]);
	});

	it("strips leading hashes and dedupes", () => {
		expect(parseDefaultTags("#vocab, #vocab, GRE")).toEqual(["vocab", "GRE"]);
	});

	it("returns an empty list for empty input", () => {
		expect(parseDefaultTags("  ")).toEqual([]);
	});
});

describe("buildInitialContent", () => {
	it("prepends a frontmatter block when tags exist", () => {
		const content = buildInitialContent("note body", ["vocab", "gre"]);
		expect(content).toBe('---\ntags: ["vocab", "gre"]\n---\n\nnote body\n');
	});

	it("omits the frontmatter block when there are no tags", () => {
		expect(buildInitialContent("note body", [])).toBe("note body\n");
	});
});

describe("buildAppendBlock", () => {
	it("separates the appended result with a rule and a timestamp", () => {
		const block = buildAppendBlock("new result");
		expect(block).toContain("\n---\n");
		expect(block).toContain("new result");
	});
});
