import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyCarriageReturnOverwrites,
  cleanTextForRender,
  expandTabs,
  normalizeNewlines,
  stripControlCharacters
} from "../render/text";

test("normalizeNewlines: CRLF -> LF", () => {
  assert.equal(normalizeNewlines("a\r\nb\nc\r"), "a\nb\nc\r");
});

test("applyCarriageReturnOverwrites: overwrite from start of line", () => {
  assert.equal(applyCarriageReturnOverwrites("abc\rZ"), "Zbc");
  assert.equal(applyCarriageReturnOverwrites("hello\rjello"), "jello");
});

test("applyCarriageReturnOverwrites: supports newline flush", () => {
  assert.equal(applyCarriageReturnOverwrites("ab\rZ\ncd"), "Zb\ncd");
});

test("stripControlCharacters: drops C0 and DEL but keeps tab/newline", () => {
  assert.equal(stripControlCharacters("a\u0007b\nc\td\u007fe"), "ab\nc\tde");
});

test("expandTabs: expands with deterministic tab stops", () => {
  assert.equal(expandTabs("a\tb", 4), "a   b");
  assert.equal(expandTabs("abc\t", 4), "abc ");
  assert.equal(expandTabs("\t", 4), "    ");
});

test("cleanTextForRender: normalizes newlines, applies CR, strips controls, expands tabs", () => {
  const input = "ab\r\n12\rZ\u0007\tX";
  const out = cleanTextForRender(input, { tabStop: 4 });
  assert.equal(out, "ab\nZ   X");
});
