import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./mobile.css";
import { MobileApp } from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>,
);

/** The poster splash lives in index.html; fade it out ~2 s after launch. */
const SPLASH_MS = 2000;
const splash = document.getElementById("boot-splash");
if (splash) {
  const wait = Math.max(0, SPLASH_MS - performance.now());
  window.setTimeout(() => {
    splash.classList.add("hide");
    window.setTimeout(() => splash.remove(), 650);
  }, wait);
}
