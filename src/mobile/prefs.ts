import { create } from "zustand";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export type Theme = "dark" | "light";
const THEME_KEY = "qr.theme";
const ONBOARD_KEY = "qr.onboarded.v1";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  if (!Capacitor.isNativePlatform()) return;
  // Status/navigation bar icons follow the theme ("DARK" = light icons).
  SystemBars.setStyle({ style: theme === "light" ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
}

export const usePrefs = create<{
  loaded: boolean;
  theme: Theme;
  onboarded: boolean;
  load: () => Promise<void>;
  setTheme: (t: Theme) => void;
  finishOnboarding: () => void;
}>((set) => ({
  loaded: false,
  theme: "dark",
  onboarded: true,
  load: async () => {
    const [t, o] = await Promise.all([Preferences.get({ key: THEME_KEY }), Preferences.get({ key: ONBOARD_KEY })]);
    const theme: Theme = t.value === "light" ? "light" : "dark";
    applyTheme(theme);
    set({ theme, onboarded: o.value === "1", loaded: true });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    void Preferences.set({ key: THEME_KEY, value: theme });
  },
  finishOnboarding: () => {
    set({ onboarded: true });
    void Preferences.set({ key: ONBOARD_KEY, value: "1" });
  },
}));
