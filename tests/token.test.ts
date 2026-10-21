import { test } from "node:test";
import assert from "node:assert/strict";
import { expiresAt, isTokenFresh, singleFlight } from "../src/token.ts";

test("expiresAt subtracts a 60 second safety margin", () => {
  assert.equal(expiresAt(3600, 1_000_000), 1_000_000 + 3540 * 1000);
});

test("isTokenFresh handles missing, expired and valid tokens", () => {
  const tok = { access_token: "x", expires_at: 2000 };
  assert.equal(isTokenFresh(null, 1000), false);
  assert.equal(isTokenFresh(tok, 1000), true);
  assert.equal(isTokenFresh(tok, 2000), false);
  assert.equal(isTokenFresh(tok, 3000), false);
});

test("singleFlight shares one in-flight call, then allows a new one", async () => {
  let calls = 0;
  const run = singleFlight(async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 10));
    return calls;
  });
  const [a, b, c] = await Promise.all([run(), run(), run()]);
  assert.deepEqual([a, b, c], [1, 1, 1]);
  assert.equal(await run(), 2);
});

test("singleFlight recovers after a failure", async () => {
  let n = 0;
  const run = singleFlight(async () => {
    if (n++ === 0) throw new Error("boom");
    return "ok";
  });
  await assert.rejects(run(), /boom/);
  assert.equal(await run(), "ok");
});
