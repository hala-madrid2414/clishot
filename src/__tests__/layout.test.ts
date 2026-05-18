import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutTextToPages, paginateLines, wrapTextByColumns } from "../render/layout";

test("wrapTextByColumns: wraps by fixed column count", () => {
  assert.deepEqual(wrapTextByColumns("abcdef", 3), ["abc", "def"]);
});

test("wrapTextByColumns: preserves empty lines", () => {
  assert.deepEqual(wrapTextByColumns("\n", 10), ["", ""]);
});

test("paginateLines: splits into pages by row count", () => {
  assert.deepEqual(paginateLines(["1", "2", "3", "4", "5"], 2), [["1", "2"], ["3", "4"], ["5"]]);
});

test("paginateLines: empty input returns single empty page", () => {
  assert.deepEqual(paginateLines([], 10), [[""]]);
});

test("layoutTextToPages: wraps then paginates deterministically", () => {
  const pages = layoutTextToPages("abcd\nef", { cols: 3, rows: 2 });
  assert.deepEqual(pages, [["abc", "d"], ["ef"]]);
});
