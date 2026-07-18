import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  packages: "external",
} satisfies BuildOptions;

await Promise.all([
  esbuild.build({
    ...shared,
    format: "esm",
    outfile: "dist/index.js",
  }),
  esbuild.build({
    ...shared,
    format: "cjs",
    outfile: "dist/index.cjs",
  }),
]);
