declare const __APP_VERSION__: string | undefined;

/** App version shown in the UI — injected at build time from android/app/build.gradle versionName. */
export const MOBILE_VERSION: string = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "1.0.2";
