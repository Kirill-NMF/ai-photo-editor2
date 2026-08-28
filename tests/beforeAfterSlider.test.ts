import assert from "node:assert/strict";
import test from "node:test";

import { getSliderPositionFromKey } from "../client/src/lib/sliderKeyboard";

test("arrow keys move the before/after slider in five percent steps", () => {
  assert.equal(getSliderPositionFromKey(50, "ArrowLeft"), 45);
  assert.equal(getSliderPositionFromKey(50, "ArrowDown"), 45);
  assert.equal(getSliderPositionFromKey(50, "ArrowRight"), 55);
  assert.equal(getSliderPositionFromKey(50, "ArrowUp"), 55);
});

test("home and end move the slider to its boundaries", () => {
  assert.equal(getSliderPositionFromKey(50, "Home"), 0);
  assert.equal(getSliderPositionFromKey(50, "End"), 100);
});

test("keyboard movement stays within the slider boundaries", () => {
  assert.equal(getSliderPositionFromKey(2, "ArrowLeft"), 0);
  assert.equal(getSliderPositionFromKey(98, "ArrowRight"), 100);
});

test("unrelated keys leave the slider position unchanged", () => {
  assert.equal(getSliderPositionFromKey(42, "Enter"), 42);
});
