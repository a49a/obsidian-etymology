import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../settings";
import {
	buildOrganizationPrompt,
	normalizeOrganizationFolder,
	parseOrganizationPlan,
} from "./organizePlan";

describe("buildOrganizationPrompt", () => {
	it("inserts the filename list into the template", () => {
		const prompt = buildOrganizationPrompt("Group these words:\n{{fileNames}}", ["abate.md", "bias.md"]);
		expect(prompt).toContain("- abate.md");
		expect(prompt).toContain("- bias.md");
		expect(prompt).not.toContain("All filenames in this directory");
	});

	it("appends the list when the template dropped the placeholder list", () => {
		const prompt = buildOrganizationPrompt("Group these words.", ["abate.md"]);
		expect(prompt).toContain("All filenames in this directory:");
	});

	it("uses the default template shape and states the JSON contract", () => {
		const prompt = buildOrganizationPrompt(DEFAULT_SETTINGS.organizePromptTemplate, ["abate.md"]);
		expect(prompt).toContain("- abate.md");
		expect(prompt).toContain('"assignments"');
	});
});

describe("normalizeOrganizationFolder", () => {
	it("keeps nested folder names and trims slashes", () => {
		expect(normalizeOrganizationFolder("/Emotions/")).toBe("Emotions");
		expect(normalizeOrganizationFolder("a\\b")).toBe("a/b");
	});

	it("rejects traversal and empty folders", () => {
		expect(normalizeOrganizationFolder("..")).toBe("");
		expect(normalizeOrganizationFolder("a/../b")).toBe("");
		expect(normalizeOrganizationFolder("   ")).toBe("");
	});
});

describe("parseOrganizationPlan", () => {
	const files = ["abate.md", "bias.md"];

	it("parses a valid plan", () => {
		const plan = parseOrganizationPlan(
			'{"assignments":[{"file":"abate.md","folder":"Emotions"},{"file":"bias.md","folder":"Bias"}]}',
			files,
			"en"
		);
		expect(plan).toEqual([
			{ file: "abate.md", folder: "Emotions" },
			{ file: "bias.md", folder: "Bias" },
		]);
	});

	it("parses a plan wrapped in a fenced code block", () => {
		const plan = parseOrganizationPlan(
			'```json\n{"assignments":[{"file":"abate.md","folder":"Emotions"},{"file":"bias.md","folder":"Bias"}]}\n```',
			files,
			"en"
		);
		expect(plan).toHaveLength(2);
	});

	it("throws when JSON is missing or malformed", () => {
		expect(() => parseOrganizationPlan("no json here", files, "en")).toThrow();
		expect(() => parseOrganizationPlan('{"assignments":"nope"}', files, "en")).toThrow();
	});

	it("throws when a file is assigned twice or unknown", () => {
		const duplicate = '{"assignments":[{"file":"abate.md","folder":"A"},{"file":"abate.md","folder":"B"},{"file":"bias.md","folder":"C"}]}';
		expect(() => parseOrganizationPlan(duplicate, files, "en")).toThrow();
		const unknown = '{"assignments":[{"file":"abate.md","folder":"A"},{"file":"ghost.md","folder":"B"}]}';
		expect(() => parseOrganizationPlan(unknown, files, "en")).toThrow();
	});

	it("throws when a file is missing from the plan", () => {
		const missing = '{"assignments":[{"file":"abate.md","folder":"A"}]}';
		expect(() => parseOrganizationPlan(missing, files, "en")).toThrow();
	});

	it("throws when a folder contains path traversal", () => {
		const traversal = '{"assignments":[{"file":"abate.md","folder":"../outside"},{"file":"bias.md","folder":"B"}]}';
		expect(() => parseOrganizationPlan(traversal, files, "en")).toThrow();
	});
});
