import { create } from "zustand";
import { haptic } from "./haptics";

export type Tab = "home" | "create" | "scan" | "library" | "account";
export type Sub = "templates" | "barcode" | "batch" | "dynamic" | null;

export const useNav = create<{
  tab: Tab;
  sub: Sub;
  go: (tab: Tab) => void;
  open: (sub: Exclude<Sub, null>) => void;
  back: () => boolean;
}>((set, get) => ({
  tab: "home",
  sub: null,
  go: (tab) => {
    haptic("tap");
    set({ tab, sub: null });
  },
  open: (sub) => {
    haptic("tap");
    set({ sub });
  },
  /** Returns false when there is nothing left to go back to. */
  back: () => {
    const { sub, tab } = get();
    if (sub) set({ sub: null });
    else if (tab !== "home") set({ tab: "home" });
    else return false;
    return true;
  },
}));
