import assert from "node:assert/strict";
import test from "node:test";

import { hasTelegramWidgetFrame } from "../client/src/lib/telegramWidget";

test("Telegram widget is ready only after its iframe appears", () => {
  assert.equal(hasTelegramWidgetFrame({ querySelector: () => ({}) }), true);
  assert.equal(hasTelegramWidgetFrame({ querySelector: () => null }), false);
});
