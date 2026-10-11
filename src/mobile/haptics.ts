import { Capacitor } from "@capacitor/core";

type Kind = "tap" | "success" | "warning" | "error";

/** Fire-and-forget haptic feedback (no-op outside the native app). */
export function haptic(kind: Kind = "tap"): void {
  if (!Capacitor.isNativePlatform()) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle, NotificationType }) => {
      if (kind === "tap") return Haptics.impact({ style: ImpactStyle.Light });
      const type =
        kind === "success"
          ? NotificationType.Success
          : kind === "warning"
            ? NotificationType.Warning
            : NotificationType.Error;
      return Haptics.notification({ type });
    })
    .catch(() => {});
}
