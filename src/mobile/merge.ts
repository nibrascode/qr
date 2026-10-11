/** Pure last-write-wins merge used by cloud sync (unit-tested). */
export type Versioned = { id: string; updatedAt: number };
export type Deleted = { id: string; deletedAt: number };
export type RemoteRow<T> = { item: T; deleted: boolean };

export function mergeLww<T extends Versioned>(
  local: T[],
  tombs: Deleted[],
  remote: RemoteRow<T>[],
): { live: T[]; tombs: Deleted[]; push: RemoteRow<T>[] } {
  type Entry = { item: T; deleted: boolean; at: number; origin: "local" | "remote" };
  const best = new Map<string, Entry>();
  const consider = (e: Entry) => {
    const cur = best.get(e.item.id);
    // Ties keep the remote copy, so equal versions are not pushed again.
    if (!cur || e.at > cur.at || (e.at === cur.at && e.origin === "remote")) best.set(e.item.id, e);
  };
  const remoteAt = new Map<string, number>();
  for (const r of remote) {
    remoteAt.set(r.item.id, r.item.updatedAt);
    consider({ item: r.item, deleted: r.deleted, at: r.item.updatedAt, origin: "remote" });
  }
  const localById = new Map(local.map((l) => [l.id, l]));
  for (const l of local) consider({ item: l, deleted: false, at: l.updatedAt, origin: "local" });
  for (const t of tombs) {
    const base = localById.get(t.id) ?? remote.find((r) => r.item.id === t.id)?.item;
    if (base) consider({ item: { ...base, updatedAt: t.deletedAt }, deleted: true, at: t.deletedAt, origin: "local" });
  }
  const live: T[] = [];
  const outTombs: Deleted[] = [];
  const push: RemoteRow<T>[] = [];
  for (const e of best.values()) {
    if (e.deleted) outTombs.push({ id: e.item.id, deletedAt: e.at });
    else live.push(e.item);
    if (e.origin === "local" && (remoteAt.get(e.item.id) ?? -1) < e.at) {
      push.push({ item: e.item, deleted: e.deleted });
    }
  }
  return { live, tombs: outTombs, push };
}
