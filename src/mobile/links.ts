import { Capacitor } from "@capacitor/core";

export const NIBRAS_CODE_URL = "https://www.nibrascode.com";
export { QR_PRIVACY_URL, QR_DELETE_URL } from "./privacy-text";

/** Open an external page in the in-app browser (native) or a new tab (web). */
export async function openUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener");
  }
}
