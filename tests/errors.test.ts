import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFormsError } from "../src/errors.ts";

test("403 accessNotConfigured points to the setup guide", () => {
  const msg = formatFormsError(403, {
    error: { message: "Forms API has not been used in project 123", errors: [{ reason: "accessNotConfigured" }] },
  });
  assert.match(msg, /not enabled/);
  assert.match(msg, /BRING-YOUR-OWN-CLIENT/);
});

test("403 SERVICE_DISABLED is recognised from error details", () => {
  assert.match(formatFormsError(403, { error: { message: "x", details: [{ reason: "SERVICE_DISABLED" }] } }), /not enabled/);
});

test("other 403s keep Google's message", () => {
  assert.equal(formatFormsError(403, { error: { message: "The caller does not have permission" } }), "Forms API 403: The caller does not have permission");
});

test("404 explains the likely cause", () => {
  assert.match(formatFormsError(404, { error: { message: "Requested entity was not found." } }), /not found/);
});

test("falls back to JSON when there is no error message", () => {
  assert.equal(formatFormsError(500, {}), "Forms API 500: {}");
});
