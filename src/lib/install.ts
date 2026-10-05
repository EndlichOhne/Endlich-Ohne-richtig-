export const INSTALL_HINT_KEY = "eo-install-hint";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function loadInstallHintDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(INSTALL_HINT_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissInstallHint() {
  localStorage.setItem(INSTALL_HINT_KEY, "1");
}
