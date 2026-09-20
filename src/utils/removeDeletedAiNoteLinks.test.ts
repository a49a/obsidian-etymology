import { describe, expect, it } from "vitest";
import { getLinkTarget, getVisibleText } from "./removeDeletedAiNoteLinks";

describe("getLinkTarget", () => {
	it("strips aliases, headings and blocks", () => {
		expect(getLinkTarget("GRE/Words/abate|abate")).toBe("GRE/Words/abate");
		expect(getLinkTarget("abate#Etymology")).toBe("abate");
		expect(getLinkTarget("abate#^block")).toBe("abate");
	});

	it("trims whitespace around the target", () => {
		expect(getLinkTarget(" abate ")).toBe("abate");
	});
});

describe("getVisibleText", () => {
	it("prefers the alias", () => {
		expect(getVisibleText("GRE/Words/abate|reduce")).toBe("reduce");
	});

	it("falls back to the file name of the target", () => {
		expect(getVisibleText("GRE/Words/abate")).toBe("abate");
	});
});
