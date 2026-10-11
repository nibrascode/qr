import { create } from "zustand";
import { Preferences } from "@capacitor/preferences";
import type { Plan } from "@/lib/qr/types";
import {
  currentSession,
  signInWithGoogle,
  signOut as backendSignOut,
  supabase,
  toMobileUser,
  verifyEntitlement,
  type MobileUser,
} from "./backend";
import { backendConfigured } from "./config";
import {
  configurePurchases,
  getProInfo,
  identify,
  resetIdentity,
  type ProInfo,
} from "./purchases";
import { LIMITS } from "./storage";
import { syncCodes } from "./sync";

const SERVER_PRO_KEY = "qr.server-pro";

type SessionState = {
  user: MobileUser | null;
  /** Pro from RevenueCat (store purchase, cached by the SDK, works offline). */
  storePro: ProInfo | null;
  /** Pro as last confirmed by our server (RevenueCat REST v2), cached locally. */
  serverPro: boolean;
  ready: boolean;
  busy: boolean;
  syncing: boolean;
  lastSync: number | null;
  init: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setStorePro: (p: ProInfo) => void;
  refreshServerPro: () => Promise<void>;
  sync: () => Promise<void>;
};

let initOnce: Promise<void> | null = null;

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  storePro: null,
  serverPro: false,
  ready: false,
  busy: false,
  syncing: false,
  lastSync: null,

  init: () => {
    initOnce ??= (async () => {
      const cachedServerPro = (await Preferences.get({ key: SERVER_PRO_KEY })).value === "1";
      const session = backendConfigured ? await currentSession() : null;
      const user = session?.user ? toMobileUser(session.user) : null;
      set({ user, serverPro: user ? cachedServerPro : false, ready: true });

      if (backendConfigured) {
        supabase().auth.onAuthStateChange((event, s) => {
          if (event === "SIGNED_OUT") set({ user: null, serverPro: false });
          else if (s?.user) set({ user: toMobileUser(s.user) });
        });
      }

      const ok = await configurePurchases(user?.id ?? null, (p) => get().setStorePro(p));
      if (ok) {
        try {
          get().setStorePro(await getProInfo());
        } catch {
          /* offline before the first fetch */
        }
      }
      if (user) {
        void get().refreshServerPro().then(() => get().sync());
      }
    })();
    return initOnce;
  },

  setStorePro: (p) => set({ storePro: p }),

  refreshServerPro: async () => {
    if (!get().user) return;
    const res = await verifyEntitlement();
    if (!res) return; // offline: keep cache
    set({ serverPro: res.pro });
    await Preferences.set({ key: SERVER_PRO_KEY, value: res.pro ? "1" : "0" });
  },

  sync: async () => {
    const { user, syncing } = get();
    if (!user || syncing || !isPro(get())) return;
    set({ syncing: true });
    try {
      await syncCodes(user.id);
      set({ lastSync: Date.now() });
    } catch (err) {
      console.warn("sync failed", err);
    } finally {
      set({ syncing: false });
    }
  },

  signIn: async () => {
    set({ busy: true });
    try {
      const user = await signInWithGoogle();
      set({ user });
      try {
        get().setStorePro(await identify(user.id));
      } catch {
        /* RevenueCat unavailable */
      }
      await get().refreshServerPro();
      void get().sync();
    } finally {
      set({ busy: false });
    }
  },

  signOut: async () => {
    set({ busy: true });
    try {
      await backendSignOut();
      try {
        get().setStorePro(await resetIdentity());
      } catch {
        set({ storePro: null });
      }
      await Preferences.remove({ key: SERVER_PRO_KEY });
      set({ user: null, serverPro: false });
    } finally {
      set({ busy: false });
    }
  },
}));

function isPro(s: Pick<SessionState, "storePro" | "serverPro">): boolean {
  return Boolean(s.storePro?.pro) || s.serverPro;
}

export const useIsPro = () => useSession(isPro);

/** The app has one paid level: RevenueCat `nibras_qr_pro` → "premium" limits. */
export function usePlan(): Plan {
  return useIsPro() ? "premium" : "free";
}

export function useLimits() {
  return useIsPro() ? LIMITS.pro : LIMITS.free;
}
