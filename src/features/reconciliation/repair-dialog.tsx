"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  PencilSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import type { ChangePreview, Entry, ProjectView, ChangeRow } from "@/contracts";
import { api } from "@/lib/tauri/client";
import { readableError, useI18n } from "@/i18n/provider";

function stem(entry: Entry) {
  const name = entry.name.replace(/^\d+(?:\.\d+)* /, "");
  const dot = name.lastIndexOf(".");
  return !entry.isDir && dot > 0 ? name.slice(0, dot) : name;
}
export function RepairDialog({
  view,
  entries,
  rename,
  onClose,
  onApplied,
}: {
  view: ProjectView;
  entries: Entry[];
  rename: boolean;
  onClose: () => void;
  onApplied: (view: ProjectView, changes: ChangeRow[]) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(rename);
  const [drafts, setDrafts] = useState(() =>
    entries.map((e) => ({ id: e.id, name: stem(e), number: "" })),
  );
  const [kind, setKind] = useState("__keep");
  const [tags, setTags] = useState<string[]>([]);
  const [replaceTags, setReplaceTags] = useState(false);
  const [plan, setPlan] = useState<ChangePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  function fail(e: unknown) {
    setError(readableError(e, t));
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  async function preview(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      setPlan(
        await api.previewChanges(
          view.project.id,
          drafts.map((d) => ({
            id: d.id,
            description: editing ? d.name : null,
            number: editing && d.number ? Number(d.number) : null,
            kind: kind === "__keep" ? null : kind,
            tags: replaceTags ? tags : null,
          })),
        ),
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      onApplied(await api.applyChanges(view.project.id, plan.id), plan.changes);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={t(plan ? "changeReview" : "repairTitle")}
      wide
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={preview}>
        <div className="dialog-body repair-body">
          <div className="repair-intro">
            <span className="repair-symbol flex rounded-[12px] bg-selected p-[14px] text-primary">
              {plan ? (
                <CheckCircle size={26} aria-hidden />
              ) : (
                <PencilSimple size={26} aria-hidden />
              )}
            </span>
            <div>
              <h3>{t(plan ? "changeReview" : "repairTitle")}</h3>
              <p>{t(plan ? "changeReviewHint" : "repairHint")}</p>
            </div>
          </div>
          <div
            className="repair-error"
            ref={errorRef}
            tabIndex={-1}
            role={error ? "alert" : undefined}
          >
            {error ? (
              <>
                <WarningCircle size={20} aria-hidden />
                <span>{error}</span>
              </>
            ) : null}
          </div>
          {plan ? (
            <>
              <div className="repair-count">
                {plan.changes.length} {t("affectedItems")}
              </div>
              <div className="change-table-wrap">
                <table className="change-table">
                  <caption className="sr-only">{t("changeReview")}</caption>
                  <thead>
                    <tr>
                      <th>{t("beforeName")}</th>
                      <th aria-label={t("changeArrow")} />
                      <th>{t("afterName")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.changes.map((row) => (
                      <tr key={row.entryId}>
                        <td>{row.before}</td>
                        <td>
                          <ArrowRight size={16} aria-hidden />
                        </td>
                        <td>
                          <strong>{row.after}</strong>
                          <small>
                            {view.project.types.find((v) => v.id === row.kind)
                              ?.name || t("unclassified")}
                            {row.tags.length
                              ? ` · ${row.tags.map((id) => view.project.tags.find((v) => v.id === id)?.name || id).join(", ")}`
                              : ""}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <label className="checkbox-label repair-mode mb-4">
                <input
                  type="checkbox"
                  checked={editing}
                  onChange={(e) => setEditing(e.target.checked)}
                />
                {t("editBeforeNormalize")}
              </label>
              <div className="repair-edit-list">
                {drafts.map((draft, index) => (
                  <div className="repair-edit-row" key={draft.id}>
                    <p title={entries[index].relativePath}>
                      {entries[index].relativePath}
                    </p>
                    <div className="repair-edit-fields">
                      <div className="field">
                        <label htmlFor={`repair-name-${index}`}>
                          {t("newDescription")}
                        </label>
                        <input
                          id={`repair-name-${index}`}
                          maxLength={160}
                          value={draft.name}
                          readOnly={!editing}
                          onChange={(e) =>
                            setDrafts((current) =>
                              current.map((d) =>
                                d.id === draft.id
                                  ? { ...d, name: e.target.value }
                                  : d,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`repair-code-${index}`}>
                          {t("lastSegment")}
                        </label>
                        <input
                          id={`repair-code-${index}`}
                          type="number"
                          min={1}
                          max={999999}
                          step={1}
                          placeholder={t("automatic")}
                          disabled={!editing}
                          value={draft.number}
                          onChange={(e) =>
                            setDrafts((current) =>
                              current.map((d) =>
                                d.id === draft.id
                                  ? { ...d, number: e.target.value }
                                  : d,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="hint">{t("cascadeHint")}</p>
              {view.project.types.length ? (
                <div className="field">
                  <label htmlFor="repair-kind">{t("batchType")}</label>
                  <select
                    id="repair-kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="__keep">{t("keepMetadata")}</option>
                    <option value="">{t("unclassified")}</option>
                    {view.project.types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {view.project.tags.length ? (
                <div className="field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={replaceTags}
                      onChange={(e) => setReplaceTags(e.target.checked)}
                    />
                    {t("replaceTags")}
                  </label>
                  {replaceTags ? (
                    <div className="chips mt-[10px] flex flex-wrap gap-[6px]">
                      {view.project.tags.map((tag) => (
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
                  ) : null}
                </div>
              ) : null}
            </>
          )}
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
          {plan ? (
            <>
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => {
                  setPlan(null);
                  setError("");
                }}
              >
                {t("back")}
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy}
                onClick={() => void apply()}
              >
                {t(busy ? "working" : "applyChanges")}
              </button>
            </>
          ) : (
            <button className="button primary" type="submit" disabled={busy}>
              {t(busy ? "working" : "previewChanges")}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
