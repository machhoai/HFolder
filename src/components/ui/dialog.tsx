"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/provider";

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? "dialog-wide" : ""}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label={t("close")}
          disabled={busy}
          onClick={onClose}
        >
          <XIcon size={20} aria-hidden />
        </button>
      </div>
      {children}
    </dialog>
  );
}
