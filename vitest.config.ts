import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
	resolve: {
		alias: {
			// The obsidian package ships types only; tests import modules that
			// reference it at runtime, so point it at a minimal local stub.
			obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
	},
});
