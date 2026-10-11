import assert from "node:assert/strict";
import { test } from "node:test";
import { fileNames, gs1Check, normalizeBarcode, parseBatch } from "./codes.ts";

test("gs1 check digit", () => {
  assert.equal(gs1Check("400638133393"), 1); // 4006381333931
  assert.equal(gs1Check("03600029145"), 2); // UPC 036000291452
});

test("normalize barcodes", () => {
  assert.equal(normalizeBarcode("ean13", "400638133393"), "4006381333931");
  assert.equal(normalizeBarcode("ean13", "4006381333931"), "4006381333931");
  assert.equal(normalizeBarcode("ean13", "4006381333932"), null);
  assert.equal(normalizeBarcode("upca", "03600029145"), "036000291452");
  assert.equal(normalizeBarcode("code128", "ABC-123"), "ABC-123");
  assert.equal(normalizeBarcode("code128", "Ə"), null);
  assert.equal(normalizeBarcode("datamatrix", "anything"), "anything");
});

test("parse batch lines and csv", () => {
  const r = parseBatch('name,value\nMenu,https://a.example/menu\n"Shop, Main",https://b.example\nhttps://c.example\n\n');
  assert.equal(r.items.length, 3);
  assert.deepEqual(r.items[1], { name: "Shop, Main", value: "https://b.example" });
  assert.equal(r.items[2].name, "c.example");
  assert.equal(parseBatch("a\nb\nc", 2).truncated, true);
});

test("unique file names", () => {
  assert.deepEqual(fileNames([{ name: "Menu", value: "x" }, { name: "Menu", value: "y" }, { name: "", value: "z" }], "png"), [
    "Menu.png",
    "Menu-2.png",
    "qr-3.png",
  ]);
});
