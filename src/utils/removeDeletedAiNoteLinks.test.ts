import { describe, expect, it } from "vitest";
import { TFile } from "obsidian";
import type { MetadataCache, Vault } from "obsidian";
import {
	getLinkDestinationPath,
	getLinkTarget,
	getVisibleText,
	removeDeletedAiNoteLinks,
	removeMissingAiNoteLinks,
} from "./removeDeletedAiNoteLinks";

function makeFile(path: string): TFile {
	return Object.assign(new TFile(), {
		path,
		extension: "md",
		basename: path.split("/").pop() ?? path,
	});
}

function makeVault(files: Record<string, string>): { vault: Vault; store: Map<string, string>; reads: string[] } {
	const store = new Map(Object.entries(files));
	const reads: string[] = [];
	const vault = {
		getMarkdownFiles: () => [...store.keys()].map(makeFile),
		read: async (file: TFile) => {
			reads.push(file.path);
			return store.get(file.path) ?? "";
		},
		modify: async (file: TFile, content: string) => {
			store.set(file.path, content);
		},
	};
	return { vault: vault as unknown as Vault, store, reads };
}

interface FakeLinkCache {
	links?: Array<{ link: string }>;
}

function makeMetadataCache(
	caches: Record<string, FakeLinkCache>,
	existingPaths: string[] = []
): MetadataCache {
	const existing = new Set(existingPaths);
	return {
		getCache: (path: string) => caches[path] ?? null,
		getFirstLinkpathDest: (linkpath: string) => {
			if (existing.has(linkpath)) {
				return { path: linkpath };
			}
			if (existing.has(`${linkpath}.md`)) {
				return { path: `${linkpath}.md` };
			}
			return null;
		},
	} as unknown as MetadataCache;
}

describe("removeDeletedAiNoteLinks", () => {
	it("rewrites only notes whose cached links point at the deleted note", async () => {
		const { vault, store, reads } = makeVault({
			"GRE/Words/a.md": "see [[deepseek-results/abate|abate]] end",
			"GRE/Words/b.md": "no links here",
			"GRE/Words/c.md": "embed ![[deepseek-results/abate]] gone",
			"Elsewhere/d.md": "[[deepseek-results/abate]] outside dir",
		});
		const cache = makeMetadataCache({
			"GRE/Words/a.md": { links: [{ link: "deepseek-results/abate" }] },
			"GRE/Words/b.md": {},
			"GRE/Words/c.md": { links: [{ link: "deepseek-results/abate" }] },
			"Elsewhere/d.md": { links: [{ link: "deepseek-results/abate" }] },
		});

		const updated = await removeDeletedAiNoteLinks(
			vault,
			cache,
			makeFile("deepseek-results/abate.md"),
			"GRE/Words"
		);

		expect(updated).toBe(2);
		expect(store.get("GRE/Words/a.md")).toBe("see abate end");
		expect(store.get("GRE/Words/c.md")).toBe("embed  gone");
		expect(store.get("Elsewhere/d.md")).toBe("[[deepseek-results/abate]] outside dir");
		expect(reads).toEqual(["GRE/Words/a.md", "GRE/Words/c.md"]);
	});

	it("leaves links to other targets untouched", async () => {
		const { vault, store } = makeVault({
			"GRE/Words/a.md": "keep [[deepseek-results/bias|bias]]",
		});
		const cache = makeMetadataCache({
			"GRE/Words/a.md": { links: [{ link: "deepseek-results/bias" }] },
		});

		const updated = await removeDeletedAiNoteLinks(
			vault,
			cache,
			makeFile("deepseek-results/abate.md"),
			"GRE/Words"
		);

		expect(updated).toBe(0);
		expect(store.get("GRE/Words/a.md")).toBe("keep [[deepseek-results/bias|bias]]");
	});
});

describe("removeMissingAiNoteLinks", () => {
	it("cleans links whose targets no longer exist and skips fully valid notes", async () => {
		const { vault, store, reads } = makeVault({
			"GRE/Words/a.md": "broken [[deepseek-results/abate|abate]] here",
			"GRE/Words/b.md": "valid [[GRE/Words/a]] ref",
			"GRE/Words/c.md": "no links",
		});
		const cache = makeMetadataCache(
			{
				"GRE/Words/a.md": { links: [{ link: "deepseek-results/abate" }] },
				"GRE/Words/b.md": { links: [{ link: "GRE/Words/a" }] },
				"GRE/Words/c.md": {},
			},
			["GRE/Words/a"]
		);

		const updated = await removeMissingAiNoteLinks(vault, cache, "GRE/Words");

		expect(updated).toBe(1);
		expect(store.get("GRE/Words/a.md")).toBe("broken abate here");
		expect(store.get("GRE/Words/b.md")).toBe("valid [[GRE/Words/a]] ref");
		expect(reads).toEqual(["GRE/Words/a.md"]);
	});
});

describe("getLinkDestinationPath", () => {
	it("appends the markdown extension to plain targets", () => {
		expect(getLinkDestinationPath("deepseek-results/abate")).toBe("deepseek-results/abate.md");
	});

	it("strips headings, blocks and aliases before normalizing", () => {
		expect(getLinkDestinationPath("deepseek-results/abate.md#Etymology")).toBe(
			"deepseek-results/abate.md"
		);
		expect(getLinkDestinationPath("deepseek-results/abate#^block-id")).toBe(
			"deepseek-results/abate.md"
		);
		expect(getLinkDestinationPath("deepseek-results/abate|abate")).toBe(
			"deepseek-results/abate.md"
		);
	});
});

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
