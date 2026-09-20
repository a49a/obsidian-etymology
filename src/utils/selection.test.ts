import { describe, expect, it } from "vitest";
import { normalizeSelectedTextForAi } from "./selection";

describe("normalizeSelectedTextForAi", () => {
	it("keeps plain text as-is", () => {
		expect(normalizeSelectedTextForAi("  abate  ")).toBe("abate");
	});

	it("unwraps wikilinks with paths and aliases", () => {
		expect(normalizeSelectedTextForAi("[[GRE/Words/abate|abate]]")).toBe("abate");
		expect(normalizeSelectedTextForAi("[[abate]]")).toBe("abate");
	});

	it("strips heading and block references", () => {
		expect(normalizeSelectedTextForAi("[[abate#Etymology]]")).toBe("abate");
		expect(normalizeSelectedTextForAi("[[abate#^block-id]]")).toBe("abate");
	});

	it("unwraps markdown links", () => {
		expect(normalizeSelectedTextForAi("[abate](https://example.com)")).toBe("abate");
	});

	it("clears links whose alias part is empty", () => {
		expect(normalizeSelectedTextForAi("[[|]]")).toBe("");
	});

	it("leaves malformed empty links untouched", () => {
		expect(normalizeSelectedTextForAi("[[]]")).toBe("[[]]");
	});
});
