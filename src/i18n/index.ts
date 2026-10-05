import zh from "./zh";

export type Language = "en" | "zh";

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "中文",
};

const storageKey = "webshare-language";
const listeners = new Set<() => void>();

function savedLanguage(): Language | undefined {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    // Storage can be unavailable (e.g. blocked site data); fall back to the browser language
  }
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
}

// A saved choice wins; otherwise follow the browser
let current: Language =
  savedLanguage() ??
  (navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en");
applyLanguage(current);

export const getLanguage = () => current;

export function setLanguage(language: Language) {
  current = language;
  applyLanguage(language);
  try {
    window.localStorage.setItem(storageKey, language);
  } catch {
    // The choice still applies until the page is closed
  }
  listeners.forEach((listener) => listener());
}

export function onLanguageChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The English text is the key, and missing translations fall back to it.
// Placeholders like {count} are filled from params in either language.
export function t(text: string, params?: Record<string, string | number>) {
  let result = current === "zh" ? (zh[text] ?? text) : text;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      result = result.split(`{${name}}`).join(String(value));
    }
  }
  return result;
}

// Marks English text kept in a constant so the translation check finds it; pass it to t() when rendering
export const msg = (text: string) => text;
