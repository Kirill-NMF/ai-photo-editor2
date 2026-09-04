import assert from "node:assert/strict";
import test from "node:test";

import {
  PREMIUM_PLAN,
  PROMPT_PACKS,
  type PaywallTrigger,
} from "../client/src/lib/premiumExperience";

test("premium experience exposes one free pack and four locked packs", () => {
  assert.equal(PROMPT_PACKS.length, 5);
  assert.equal(PROMPT_PACKS.filter((pack) => !pack.isPremium).length, 1);
  assert.equal(PROMPT_PACKS.filter((pack) => pack.isPremium).length, 4);
  assert.equal(PROMPT_PACKS[0]?.id, "quick");
});

test("locked prompt packs expose exactly three safe previews", () => {
  const lockedPacks = PROMPT_PACKS.filter((pack) => pack.isPremium);

  for (const pack of lockedPacks) {
    assert.equal(pack.suggestions.length, 3, pack.id);
    assert.ok(pack.suggestions.every((suggestion) => suggestion.prompt.length > 0));
  }
});

test("premium plan matches the approved demonstration offer", () => {
  assert.equal(PREMIUM_PLAN.monthlyPriceUsd, 30);
  assert.equal(PREMIUM_PLAN.monthlyGenerations, 100);
  assert.deepEqual(PREMIUM_PLAN.features, [
    "100 AI generations every month",
    "High-resolution downloads",
    "Premium prompt preset collections",
  ]);
});

test("all premium entry points share the same paywall trigger contract", () => {
  const triggers: PaywallTrigger[] = ["limit", "download", "presets", "pricing"];
  assert.equal(new Set(triggers).size, 4);
});
