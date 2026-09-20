export class TFile {}
export class TFolder {}
export class Notice {}
export const MarkdownRenderer = {
	render() {
		throw new Error("MarkdownRenderer.render is not available in tests");
	},
};
export function normalizePath(inputPath: string): string {
	return inputPath.replace(/\\/g, "/");
}
