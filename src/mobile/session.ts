import { create } from "zustand";
import type { Plan } from "@/lib/qr/types";
import { fetchMe, getCachedMe, signInWithGoogle, signOut, type Me } from "./api";

type SessionState = {
  me: Me | null;
  ready: boolean;
  busy: boolean;
  /** Load the cached session instantly, then refresh from the backend if online. */
  init: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<SessionState>((set) => ({
  me: null,
  ready: false,
  busy: false,
  init: async () => {
    const cached = await getCachedMe();
    set({ me: cached, ready: true });
    try {
      const fresh = await fetchMe();
      set({ me: fresh });
    } catch {
      /* offline or server down: keep the cached plan */
    }
  },
  signIn: async () => {
    set({ busy: true });
    try {
      const me = await signInWithGoogle();
      set({ me });
    } finally {
      set({ busy: false });
    }
  },
  signOut: async () => {
    set({ busy: true });
    try {
      await signOut();
      set({ me: null });
    } finally {
      set({ busy: false });
    }
  },
}));

export function usePlan(): Plan {
  return useSession((s) => s.me?.plan ?? "free");
}
