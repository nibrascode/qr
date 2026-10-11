import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, parseWifi, urlWarnings } from "./scan-intel.ts";

test("wifi with escapes", () => {
  assert.deepEqual(parseWifi("WIFI:T:WPA;S:My\\;Net;P:p\\:ss;H:true;;"), {
    ssid: "My;Net",
    password: "p:ss",
    security: "WPA",
    hidden: true,
  });
});

test("classify kinds", () => {
  assert.equal(classify("https://example.com").kind, "url");
  assert.equal(classify("www.example.com").kind, "url");
  assert.equal(classify("WIFI:S:x;;").kind, "wifi");
  const v = classify("BEGIN:VCARD\nVERSION:3.0\nFN:Ali Veli\nEND:VCARD");
  assert.equal(v.kind, "vcard");
  assert.equal(v.kind === "vcard" && v.name, "Ali Veli");
  assert.equal(classify("BEGIN:VEVENT\nSUMMARY:Party\nEND:VEVENT").kind, "event");
  assert.equal(classify("tel:+994501234567").kind, "tel");
  assert.equal(classify("hello").kind, "text");
  assert.equal(classify("MECARD:N:Doe,John;TEL:123;;").kind, "vcard");
});

test("url warnings", () => {
  assert.deepEqual(urlWarnings("https://example.com/a"), []);
  assert.ok(urlWarnings("https://bit.ly/abc").includes("short"));
  assert.ok(urlWarnings("http://192.168.0.1/login").includes("ip"));
  assert.ok(urlWarnings("http://192.168.0.1/login").includes("http"));
  assert.ok(urlWarnings("https://xn--pple-43d.com").includes("puny"));
  assert.ok(urlWarnings("https://paypal.com@evil.example/").includes("at"));
  assert.ok(urlWarnings("https://free-gift.top/").includes("tld"));
});
