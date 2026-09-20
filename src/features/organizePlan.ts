import { t, type ResolvedLanguage } from "../i18n";

export interface WordOrganizationAssignment {
	file: string;
	folder: string;
}

export function buildOrganizationPrompt(template: string, fileNames: string[]): string {
	const fileList = fileNames.map((fileName) => `- ${fileName}`).join("\n");
	const renderedTemplate = template.replace(/\{\{fileNames\}\}/g, fileList);
	return [
		renderedTemplate,
		renderedTemplate.includes(fileList) ? "" : `All filenames in this directory:\n${fileList}`,
		"Create subfolder names only; do not include the root output directory, file extensions, or path traversal.",
		"Every filename must appear exactly once in the assignments. Do not invent or omit filenames.",
		'Return JSON only in this exact shape: {"assignments":[{"file":"word.md","folder":"Emotions"}] }.',
	].join("\n\n");
}

export function normalizeOrganizationFolder(folder: string): string {
	const normalized = folder.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	const parts = normalized.split("/").filter(Boolean);
	if (!parts.length || parts.some((part) => part === "." || part === "..")) {
		return "";
	}
	return parts.join("/");
}

export function parseOrganizationPlan(
	response: string,
	fileNames: string[],
	language: ResolvedLanguage
): WordOrganizationAssignment[] {
	const jsonText = response.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
	const start = jsonText.indexOf("{");
	const end = jsonText.lastIndexOf("}");
	if (start < 0 || end <= start) {
		throw new Error(t(language, "organizeInvalidPlan"));
	}

	const parsed: unknown = JSON.parse(jsonText.slice(start, end + 1));
	if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { assignments?: unknown }).assignments)) {
		throw new Error(t(language, "organizeInvalidPlan"));
	}

	const knownFiles = new Set(fileNames);
	const assignedFiles = new Set<string>();
	const assignments: WordOrganizationAssignment[] = [];
	for (const item of (parsed as { assignments: unknown[] }).assignments) {
		if (!item || typeof item !== "object") {
			throw new Error(t(language, "organizeInvalidPlan"));
		}
		const assignment = item as { file?: unknown; folder?: unknown };
		if (typeof assignment.file !== "string" || typeof assignment.folder !== "string") {
			throw new Error(t(language, "organizeInvalidPlan"));
		}
		const file = assignment.file.trim();
		const folder = normalizeOrganizationFolder(assignment.folder);
		if (!knownFiles.has(file) || assignedFiles.has(file) || !folder) {
			throw new Error(t(language, "organizeInvalidPlan"));
		}
		assignedFiles.add(file);
		assignments.push({ file, folder });
	}

	if (assignedFiles.size !== knownFiles.size) {
		throw new Error(t(language, "organizeInvalidPlan"));
	}
	return assignments;
}
