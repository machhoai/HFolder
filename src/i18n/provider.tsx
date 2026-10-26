"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import vi from "./messages/vi-VN/common.json";
import en from "./messages/en.json";

export type MessageKey = keyof typeof vi;
export type Locale = "vi-VN" | "en";
const messages: Record<Locale, Partial<Record<MessageKey, string>>> = {
  "vi-VN": vi,
  en,
};
type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};
const Context = createContext<I18n | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setValue] = useState<Locale>("vi-VN");
  useEffect(() => {
    try {
      if (localStorage.getItem("hfolder.locale") === "en") setValue("en");
    } catch {
      /* Optional preference storage. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function setLocale(next: Locale) {
    setValue(next);
    try {
      localStorage.setItem("hfolder.locale", next);
    } catch {
      /* UI still works without persistence. */
    }
  }
  return (
    <Context.Provider
      value={{
        locale,
        setLocale,
        t: (key) => messages[locale][key] ?? vi[key],
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("I18nProvider required");
  return value;
}

const errorMessages: Record<string, string> = {
  STALE_PREVIEW: "stalePreview",
  TARGET_EXISTS: "targetExists",
  DUPLICATE_CODE: "duplicateCode",
  RECOVERY_REQUIRED: "recoveryHint",
  RECOVERY_CONFLICT: "recoveryConflict",
  INVALID_PARENT: "parentNeedsRepair",
  BATCH_TOO_LARGE: "batchTooLarge",
  DESKTOP_REQUIRED: "desktopNotice",
  RECONCILIATION_REQUIRED: "reviewBanner",
};
export function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "INTERNAL_ERROR";
}
export function readableError(error: unknown, t: I18n["t"]) {
  const code = errorCode(error);
  const message = errorMessages[code];
  const detail =
    typeof error === "object" && error && "detail" in error
      ? String(error.detail)
      : "";
  return message
    ? `${t(message as MessageKey)}${code === "RECOVERY_CONFLICT" && detail ? ` (${detail})` : ""}`
    : `${t("errorTitle")} · ${code}${detail ? `: ${detail}` : ""}`;
}
