/**
 * Android camera runtime permission for the native ML Kit scanner.
 *
 * Flow: checkPermissions → (not granted) requestPermissions, which shows the
 * system dialog → if the plugin still reports "not granted" without the user
 * having been asked (seen on some devices), fall back to a WebView
 * getUserMedia probe: Capacitor's WebChromeClient turns it into the same
 * Android CAMERA prompt. "denied" after a request means Android will not show
 * the dialog again ("Don't ask again" / denied twice) → only Settings helps.
 */
import type { CameraPermissionState } from "@capacitor-mlkit/barcode-scanning";

type PermissionState = CameraPermissionState;

export type CameraAccess = "granted" | "ask" | "blocked" | "unsupported";

const load = () => import("@capacitor-mlkit/barcode-scanning").then((m) => m.BarcodeScanner);

async function current(): Promise<PermissionState> {
  const scanner = await load();
  return (await scanner.checkPermissions()).camera;
}

async function probeWebView(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

/** Current state without prompting. */
export async function cameraAccess(): Promise<CameraAccess> {
  try {
    const state = await current();
    return state === "granted" || state === "limited" ? "granted" : state === "denied" ? "blocked" : "ask";
  } catch {
    return "unsupported";
  }
}

/** Ask for the camera (shows the Android dialog when the OS still allows it). */
export async function requestCamera(): Promise<CameraAccess> {
  let scanner;
  try {
    scanner = await load();
  } catch {
    return "unsupported";
  }
  let state: PermissionState = "prompt";
  try {
    state = (await scanner.checkPermissions()).camera;
  } catch {
    /* fall through to request */
  }
  if (state === "granted" || state === "limited") return "granted";
  try {
    state = (await scanner.requestPermissions()).camera;
  } catch {
    state = "prompt";
  }
  if (state === "granted" || state === "limited") return "granted";
  // Plugin request did not grant (or never showed a dialog): try the WebView route.
  if (await probeWebView()) {
    try {
      if ((await current()) === "granted") return "granted";
    } catch {
      /* ignore */
    }
    return "granted"; // getUserMedia succeeded ⇒ Android granted CAMERA
  }
  try {
    state = await current();
  } catch {
    /* keep last */
  }
  return state === "granted" || state === "limited" ? "granted" : state === "denied" ? "blocked" : "ask";
}

export async function openAppSettings(): Promise<void> {
  try {
    await (await load()).openSettings();
  } catch {
    /* no-op */
  }
}
