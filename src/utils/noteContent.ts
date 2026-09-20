export function parseDefaultTags(input: string): string[] {
	return input
		.split(/[\s,]+/)
		.map((tag) => tag.trim().replace(/^#/, ""))
		.filter((tag) => tag.length > 0)
		.filter((tag, index, arr) => arr.indexOf(tag) === index);
}

export function buildInitialContent(result: string, tags: string[]): string {
	if (tags.length > 0) {
		const frontmatterTags = tags.map((tag) => `"${tag}"`).join(", ");
		return [
			"---",
			`tags: [${frontmatterTags}]`,
			"---",
			"",
			result,
			"",
		].join("\n");
	}

	return [
		result,
		"",
	].join("\n");
}

export function buildAppendBlock(result: string): string {
	return [
		"",
		"",
		"---",
		"",
		`${new Date().toLocaleString()}`,
		"",
		result,
		"",
	].join("\n");
}
