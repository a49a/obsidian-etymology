import { describe, expect, it } from "vitest";
import {
	buildAnkiImportFile,
	buildDeckName,
	escapeAnkiField,
	flattenHtmlForAnki,
	parseFrontmatterTags,
	splitFrontmatter,
} from "./ankiFormat";

describe("splitFrontmatter", () => {
	it("strips a leading frontmatter block and extracts tags", () => {
		const { body, tags } = splitFrontmatter('---\ntags: ["GRE", "vocab"]\n---\n\nbody text\n');
		expect(body).toBe("body text");
		expect(tags).toEqual(["GRE", "vocab"]);
	});

	it("keeps horizontal rules in the body", () => {
		const { body } = splitFrontmatter("---\ntags: [GRE]\n---\n\npart one\n\n---\n\npart two\n");
		expect(body).toContain("part one");
		expect(body).toContain("part two");
	});

	it("returns the whole content when there is no frontmatter", () => {
		const { body, tags } = splitFrontmatter("just a body");
		expect(body).toBe("just a body");
		expect(tags).toEqual([]);
	});
});

describe("parseFrontmatterTags", () => {
	it("parses quoted arrays", () => {
		expect(parseFrontmatterTags('tags: ["a", "b"]')).toEqual(["a", "b"]);
	});

	it("parses plain and space-separated values", () => {
		expect(parseFrontmatterTags("tags: a, b c")).toEqual(["a", "b", "c"]);
		expect(parseFrontmatterTags("tags: #a #b")).toEqual(["a", "b"]);
	});

	it("returns empty for an empty tags entry", () => {
		expect(parseFrontmatterTags("tags:")).toEqual([]);
		expect(parseFrontmatterTags("other: value")).toEqual([]);
	});
});

describe("flattenHtmlForAnki", () => {
	it("collapses newlines, tabs and repeated spaces", () => {
		expect(flattenHtmlForAnki("<p>a</p>\n\t<p>b</p>   <p>c</p>")).toBe("<p>a</p> <p>b</p> <p>c</p>");
	});

	it("protects preformatted blocks and converts their newlines", () => {
		expect(flattenHtmlForAnki("<pre>line1\nline2</pre>")).toBe("<pre>line1<br>line2</pre>");
	});

	it("keeps multiple pre blocks in order", () => {
		expect(flattenHtmlForAnki("<pre>a\nb</pre> mid <pre>c\nd</pre>")).toBe(
			"<pre>a<br>b</pre> mid <pre>c<br>d</pre>"
		);
	});
});

describe("buildDeckName", () => {
	it("builds a hierarchy from subfolders", () => {
		expect(buildDeckName("GRE", "deepseek-results", "deepseek-results/Emotions/abate.md")).toBe(
			"GRE::Emotions"
		);
	});

	it("uses the root deck for top-level notes", () => {
		expect(buildDeckName("GRE", "deepseek-results", "deepseek-results/abate.md")).toBe("GRE");
	});

	it("sanitizes characters Anki rejects in deck names", () => {
		expect(buildDeckName('GR"E', "out", "out/sub/word.md")).toBe("GR'E::sub");
	});
});

describe("escapeAnkiField", () => {
	it("removes tabs and newlines that would break the TSV record", () => {
		expect(escapeAnkiField("a\tb\nc\rd ")).toBe("a b c d");
	});
});

describe("buildAnkiImportFile", () => {
	it("writes import headers and one record per card", () => {
		const file = buildAnkiImportFile([
			{ front: "abate", backHtml: "<p>to reduce</p>", tags: ["GRE"], deck: "GRE::Emotions" },
			{ front: "bias", backHtml: "<p>slant</p>", tags: [], deck: "GRE" },
		]);
		const lines = file.split("\n");
		expect(lines[0]).toBe("#separator:tab");
		expect(lines[1]).toBe("#html:true");
		expect(lines[2]).toBe("#tags column:3");
		expect(lines[3]).toBe("#deck column:4");
		expect(lines[4]).toBe("abate\t<p>to reduce</p>\tGRE\tGRE::Emotions");
		expect(lines[5]).toBe("bias\t<p>slant</p>\t\tGRE");
		expect(lines[6]).toBe("");
		expect(lines).toHaveLength(7);
	});
});
