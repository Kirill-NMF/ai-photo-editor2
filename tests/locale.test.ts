import assert from "node:assert/strict";
import test from "node:test";

import { getNextLocale, resolveLocale } from "../client/src/lib/locale";

test("English is the default locale when no preference is stored", () => {
  assert.equal(resolveLocale(null), "en");
});

test("a supported stored locale is restored", () => {
  assert.equal(resolveLocale("en"), "en");
  assert.equal(resolveLocale("ru"), "ru");
});

test("an unsupported stored locale falls back to English", () => {
  assert.equal(resolveLocale("de"), "en");
  assert.equal(resolveLocale(""), "en");
});

test("the locale toggle switches between English and Russian", () => {
  assert.equal(getNextLocale("en"), "ru");
  assert.equal(getNextLocale("ru"), "en");
});
