"use client";
import { useEffect, useState } from "react";
import { FolderPlus } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/tauri/client";
import type { Project, ProjectView } from "@/contracts";
import { readableError, useI18n } from "@/i18n/provider";
import { displayPath } from "./model";

export function NewFolder({
  project,
  parent,
  onClose,
  onCreated,
}: {
  project: Project;
  parent: string;
  onClose: () => void;
  onCreated: (view: ProjectView) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    setPreview("");
    setError("");
    if (!name.trim()) {
      setPending(false);
      return;
    }
    setPending(true);
    const timer = setTimeout(() => {
      void api
        .previewFolder(project.id, parent, name)
        .then((value) => {
          if (active) setPreview(value);
        })
        .catch((e) => {
          if (active) setError(readableError(e, t));
        })
        .finally(() => {
          if (active) setPending(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [name, parent, project.id, t]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!preview || busy || pending) return;
    setBusy(true);
    try {
      onCreated(await api.createFolder(project.id, parent, name, kind, tags));
    } catch (e) {
      setError(readableError(e, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={t("newFolder")} onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <div className="dialog-body">
          <div className="destination">
            <FolderPlus size={20} aria-hidden />
            <div>
              <span>{t("destination")}</span>
              <strong title={displayPath(project.root, parent)}>
                {displayPath(project.root, parent)}
              </strong>
            </div>
          </div>
          <div className="field">
            <label htmlFor="folder-name">{t("folderName")}</label>
            <input
              id="folder-name"
              autoFocus
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("folderNamePlaceholder")}
            />
            <p className="hint">{t("namingHint")}</p>
          </div>
          <div className="name-preview" aria-live="polite">
            <span>{t("preview")}</span>
            <code>{pending ? t("working") : preview || t("validName")}</code>
          </div>
          {project.types.length ? (
            <div className="field">
              <label htmlFor="folder-kind">
                {t("type")} <span className="optional">{t("optional")}</span>
              </label>
              <select
                id="folder-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="">{t("unclassified")}</option>
                {project.types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {project.tags.length ? (
            <div className="field">
              <label>{t("tags")}</label>
              <div className="chips mt-[10px] flex flex-wrap gap-[6px]">
                {project.tags.map((tag) => (
                  <button
                    type="button"
                    key={tag.id}
                    className={`chip ${tags.includes(tag.id) ? "active" : ""}`}
                    aria-pressed={tags.includes(tag.id)}
                    onClick={() =>
                      setTags((current) =>
                        current.includes(tag.id)
                          ? current.filter((id) => id !== tag.id)
                          : [...current, tag.id],
                      )
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="inline-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="dialog-actions">
          <button
            type="button"
            className="button quiet"
            disabled={busy}
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={busy || pending || !preview || !!error}
          >
            <FolderPlus size={18} aria-hidden />
            {busy ? t("working") : t("saveFolder")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
