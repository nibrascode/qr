import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeLww } from "./merge.ts";

type Item = { id: string; updatedAt: number; v: string };
const it = (id: string, updatedAt: number, v = id): Item => ({ id, updatedAt, v });

test("local-only items are pushed", () => {
  const r = mergeLww([it("a", 1)], [], []);
  assert.deepEqual(r.live.map((x) => x.id), ["a"]);
  assert.equal(r.push.length, 1);
});

test("newer remote wins and is not pushed back", () => {
  const r = mergeLww([it("a", 1, "old")], [], [{ item: it("a", 5, "new"), deleted: false }]);
  assert.equal(r.live[0].v, "new");
  assert.equal(r.push.length, 0);
});

test("newer local wins and is pushed", () => {
  const r = mergeLww([it("a", 9, "mine")], [], [{ item: it("a", 5, "theirs"), deleted: false }]);
  assert.equal(r.live[0].v, "mine");
  assert.deepEqual(r.push.map((p) => p.item.v), ["mine"]);
});

test("local delete newer than remote removes and pushes tombstone", () => {
  const r = mergeLww([], [{ id: "a", deletedAt: 10 }], [{ item: it("a", 5), deleted: false }]);
  assert.equal(r.live.length, 0);
  assert.equal(r.tombs[0].id, "a");
  assert.equal(r.push[0].deleted, true);
});

test("remote delete removes local copy", () => {
  const r = mergeLww([it("a", 3)], [], [{ item: it("a", 7), deleted: true }]);
  assert.equal(r.live.length, 0);
  assert.equal(r.push.length, 0);
});

test("equal versions are not re-pushed", () => {
  const r = mergeLww([it("a", 4)], [], [{ item: it("a", 4), deleted: false }]);
  assert.equal(r.push.length, 0);
});
