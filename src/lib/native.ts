import { Capacitor } from "@capacitor/core";

/**
 * True inside the Android/iOS Capacitor shell. The shell loads the deployed web
 * app (see capacitor.config.ts), so the same bundle runs in browsers and in the
 * app; branch on this only for native-only behaviour.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function nativePlatform(): "android" | "ios" | "web" {
  try {
    return Capacitor.getPlatform() as "android" | "ios" | "web";
  } catch {
    return "web";
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Android/iOS WebViews ignore `<a download>` and lack file `navigator.share`,
 * so in the native app we write the file to the cache and open the system share
 * sheet (save to Files / Photos / Drive, send to WhatsApp, …).
 */
export async function shareFileNative(blob: Blob, filename: string, title?: string): Promise<void> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: filename,
    data,
    directory: Directory.Cache,
  });
  await Share.share({ title: title ?? filename, files: [written.uri] });
}
