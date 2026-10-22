import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// The form-ID validator lives in index.ts (which starts the server on import), so assert on its source.
test("form IDs are restricted to Google's alphabet", () => {
  const src = fs.readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  const m = src.match(/const formId = z\.string\(\)\.regex\((\/.*?\/),/);
  assert.ok(m, "formId validator not found");
  const re = new Function(`return ${m[1]}`)() as RegExp;
  assert.ok(re.test("1FAIpQLSd_abc-123456789"));
  assert.ok(!re.test("../../etc/passwd"));
  assert.ok(!re.test("abc?x=1#frag"));
  assert.ok(!re.test("short"));
});
