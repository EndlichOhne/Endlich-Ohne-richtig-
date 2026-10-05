import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the online AI fallback is German and not Italian", () => {
  const src = readFileSync(new URL("./ai-tattoo.ts", import.meta.url), "utf8");
  assert.equal(src.includes("non disponibile"), false);
  assert.equal(src.includes("questo ambiente"), false);
  assert.match(src, /Online-KI ist in dieser Umgebung nicht verfügbar/);
  assert.match(src, /Keine Diagnose, keine Garantie/);
});
