/**
 * Service worker registration for CBE Life Scoreboard.
 * Only registers in production builds — avoids interfering with CRA hot reload in dev.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Only register on HTTPS or localhost
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!isLocalhost && window.location.protocol !== "https:") return;
  // Skip in development to avoid breaking hot reload
  if (process.env.NODE_ENV !== "production") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // silent
      });
  });
}

/**
 * Optional PWA install prompt helper.
 * Captures the beforeinstallprompt event so any UI can later trigger it.
 */
let deferredPrompt = null;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

export function canInstall() {
  return deferredPrompt !== null;
}

export function onInstallAvailability(fn) {
  listeners.add(fn);
  fn(deferredPrompt !== null);
  return () => listeners.delete(fn);
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: "unavailable" };
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
  return choice;
}
