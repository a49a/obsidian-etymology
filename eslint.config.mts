import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
					projectService: {
						allowDefaultProject: [
							'eslint.config.js',
							'vitest.config.ts',
							'manifest.json'
						]
					},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["scripts/**/*.mjs", "*.mjs"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"release-files",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
