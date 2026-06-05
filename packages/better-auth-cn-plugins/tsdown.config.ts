import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/wechat.ts", "src/douyin.ts", "src/shared.ts"],
	sourcemap: true,
	dts: true,
	format: ["esm"],
	platform: "neutral",
	outExtensions: ({ format }) => ({
		js: format === "es" ? ".mjs" : format === "cjs" ? ".cjs" : ".js",
	}),
});
