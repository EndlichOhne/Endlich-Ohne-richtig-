#!/usr/bin/env node
/**
 * Nitro/Rolldown can emit a circular _ssr/ssr.mjs <-> ssr2.mjs split that
 * crashes preview/deploy with `ssr_exports is not defined`. Break the cycle
 * after each production build.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ssr = ".vercel/output/functions/__server.func/_ssr/ssr.mjs";
const ssr2 = ".vercel/output/functions/__server.func/_ssr/ssr2.mjs";
if (!existsSync(ssr) || !existsSync(ssr2)) process.exit(0);

let a = readFileSync(ssr, "utf8");
let b = readFileSync(ssr2, "utf8");

b = b.replace(/import \{ c as __exportAll\$1 \} from "\.\/ssr\.mjs";\n/, "");
if (b.includes("__exportAll$1(") && !b.includes("var __exportAll$1")) {
  const helper = `var __defProp = Object.defineProperty;
var __exportAll$1 = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
`;
  const lines = b.split("\n");
  let lastImport = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  lines.splice(lastImport + 1, 0, helper.trimEnd());
  b = lines.join("\n");
}

a = a.replace("ssr_exports as s", "server_default as s");

writeFileSync(ssr, a);
writeFileSync(ssr2, b);
