"use client";
import { useEffect, useState } from "react";
import {
  Check,
  FolderOpen,
  ArrowRight,
  Copy,
  Hash,
  Tag,
  CheckCircle,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/tauri/client";
import type { Project, ProjectInput, ProjectView } from "@/contracts";
import { readableError, useI18n } from "@/i18n/provider";

const EMPTY: ProjectInput = {
  name: "",
  root: "",
  widths: [2, 2, 3],
  types: [],
  tags: [],
};
const DRAFT_KEY = "hfolder.setup.v1";
function CatalogInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  function add() {
    const name = input.trim();
    if (
      name &&
      !values.some((v) => v.toLocaleLowerCase() === name.toLocaleLowerCase())
    )
      onChange([...values, name]);
    setInput("");
  }
  return (
    <div className="field">
      <label>
        {label} <span className="optional">{t("optional")}</span>
      </label>
      <div className="catalog-input">
        <input
          aria-label={label}
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          className="button secondary"
          onClick={add}
          disabled={!input.trim()}
        >
          {t("add")}
        </button>
      </div>
      <div className="chips mt-[10px] flex flex-wrap gap-[6px]">
        {values.map((value) => (
          <button
            type="button"
            className="chip"
            key={value}
            aria-label={`${t("remove")}: ${value}`}
            onClick={() => onChange(values.filter((v) => v !== value))}
          >
            {value}
            <span aria-hidden>×</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProjectSetup({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[];
  onClose: () => void;
  onCreated: (view: ProjectView) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProjectInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Partial<ProjectInput>;
        if (typeof data.name === "string" && Array.isArray(data.widths))
          setDraft({ ...EMPTY, ...data, root: "" });
      }
    } catch {
      /* Invalid draft is not applied. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, root: "" }));
      } catch {
        /* Drafts are optional. */
      }
  }, [draft, loaded]);
  function update<K extends keyof ProjectInput>(
    key: K,
    value: ProjectInput[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setError("");
  }
  async function choose() {
    setBusy(true);
    setError("");
    try {
      const path = await api.chooseRoot();
      if (path) {
        setDraft((prev) => ({
          ...prev,
          root: path,
          name: prev.name || path.split(/[\\/]/).pop() || "",
        }));
      }
    } catch (e) {
      setError(readableError(e, t));
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    setError("");
    try {
      const view = await api.createProject(draft);
      localStorage.removeItem(DRAFT_KEY);
      onCreated(view);
    } catch (e) {
      setError(readableError(e, t));
    } finally {
      setBusy(false);
    }
  }
  const widthsValid =
    draft.widths.length > 0 &&
    draft.widths.every((w) => Number.isInteger(w) && w >= 1 && w <= 6);
  const canContinue =
    step === 0
      ? Boolean(draft.name.trim() && draft.root)
      : step === 1
        ? widthsValid
        : true;
  const steps = [
    { name: t("general"), icon: FolderOpen },
    { name: t("numbering"), icon: Hash },
    { name: t("classification"), icon: Tag },
    { name: t("review"), icon: CheckCircle },
  ];
  const sample = draft.widths
    .map((width, i) =>
      String(i === 0 ? 3 : 1).padStart(
        Number.isFinite(width) ? Math.min(Math.max(width, 1), 6) : 1,
        "0",
      ),
    )
    .join(".");
  return (
    <Dialog title={t("setup")} wide onClose={onClose} busy={busy}>
      <div className="setup-layout flex min-h-135">
        <aside className="setup-steps">
          <p className="eyebrow">HFOLDER WORKSPACE</p>
          <p className="setup-intro">{t("setupText")}</p>
          <ol>
            {steps.map((item, i) => (
              <li
                key={item.name}
                className={`${i === step ? "current" : ""} ${i < step ? "complete" : ""}`}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="step-number">
                  {i < step ? <Check size={16} aria-hidden /> : i + 1}
                </span>
                <span>{item.name}</span>
              </li>
            ))}
          </ol>
          <div className="setup-privacy mt-auto flex items-center gap-[7px] pt-7 text-[10px] text-muted">
            <CheckCircle size={18} aria-hidden />
            {t("local")}
          </div>
        </aside>
        <div className="setup-main">
          <div className="setup-content" key={step}>
            {step === 0 ? (
              <>
                <p className="eyebrow">01 / {t("general")}</p>
                <h3>{t("start")}</h3>
                <p className="muted">{t("startText")}</p>
                <div className="field">
                  <label htmlFor="project-name">{t("projectName")}</label>
                  <input
                    autoFocus
                    id="project-name"
                    maxLength={120}
                    value={draft.name}
                    placeholder={t("projectNamePlaceholder")}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="project-root">{t("rootFolder")}</label>
                  <div className="root-picker">
                    <input
                      id="project-root"
                      readOnly
                      value={draft.root.replace(/^\\\\\?\\/, "")}
                      placeholder={t("chooseFolder")}
                    />
                    <button
                      type="button"
                      className="button secondary"
                      onClick={choose}
                      disabled={busy}
                    >
                      <FolderOpen size={18} aria-hidden />
                      {t("chooseFolder")}
                    </button>
                  </div>
                  <p className="hint">{t("rootHint")}</p>
                </div>
                {projects.length ? (
                  <div className="field">
                    <label htmlFor="copy-config">
                      <Copy size={16} aria-hidden /> {t("copyConfig")}
                    </label>
                    <select
                      id="copy-config"
                      defaultValue=""
                      onChange={(e) => {
                        const p = projects.find((p) => p.id === e.target.value);
                        if (p)
                          setDraft((prev) => ({
                            ...prev,
                            widths: [...p.widths],
                            types: p.types.map((t) => t.name),
                            tags: p.tags.map((t) => t.name),
                          }));
                      }}
                    >
                      <option value="">{t("noCopy")}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="hint">{t("copyHint")}</p>
                  </div>
                ) : null}
              </>
            ) : null}
            {step === 1 ? (
              <>
                <p className="eyebrow">02 / {t("numbering")}</p>
                <h3>{t("widths")}</h3>
                <p className="muted">{t("widthHint")}</p>
                <div className="width-inputs">
                  {draft.widths.map((value, i) => (
                    <div className="field" key={i}>
                      <label htmlFor={`width-${i}`}>
                        {t("level")} {i + 1}
                      </label>
                      <input
                        id={`width-${i}`}
                        type="number"
                        min={1}
                        max={6}
                        value={Number.isFinite(value) ? value : ""}
                        onChange={(e) =>
                          update(
                            "widths",
                            draft.widths.map((n, j) =>
                              j === i ? e.target.valueAsNumber : n,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="button-row flex flex-wrap gap-2">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={draft.widths.length >= 8}
                    onClick={() => update("widths", [...draft.widths, 3])}
                  >
                    {t("addLevel")}
                  </button>
                  <button
                    className="button quiet"
                    type="button"
                    disabled={draft.widths.length <= 1}
                    onClick={() => update("widths", draft.widths.slice(0, -1))}
                  >
                    {t("removeLevel")}
                  </button>
                </div>
                <div className="code-preview">
                  <span>{t("numberingPreview")}</span>
                  <strong>{sample}</strong>
                  <p>{t("namingHint")}</p>
                </div>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <p className="eyebrow">03 / {t("classification")}</p>
                <h3>
                  {t("classification")}{" "}
                  <span className="optional">{t("optional")}</span>
                </h3>
                <p className="muted">{t("classificationHint")}</p>
                <CatalogInput
                  label={t("types")}
                  placeholder={t("addType")}
                  values={draft.types}
                  onChange={(values) => update("types", values)}
                />
                <CatalogInput
                  label={t("tags")}
                  placeholder={t("addTag")}
                  values={draft.tags}
                  onChange={(values) => update("tags", values)}
                />
              </>
            ) : null}
            {step === 3 ? (
              <>
                <p className="eyebrow">04 / {t("review")}</p>
                <div className="review-icon">
                  <CheckCircle size={36} aria-hidden />
                </div>
                <h3>{t("readyTitle")}</h3>
                <p className="muted">{t("reviewHint")}</p>
                <dl className="review-list">
                  <div>
                    <dt>{t("projectName")}</dt>
                    <dd>{draft.name}</dd>
                  </div>
                  <div>
                    <dt>{t("rootFolder")}</dt>
                    <dd className="mono">
                      {draft.root.replace(/^\\\\\?\\/, "")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("rule")}</dt>
                    <dd className="mono">{sample}</dd>
                  </div>
                  <div>
                    <dt>{t("classification")}</dt>
                    <dd>
                      {draft.types.length} {t("typesCount")} ·{" "}
                      {draft.tags.length} {t("tagsCount")}
                    </dd>
                  </div>
                </dl>
              </>
            ) : null}
          </div>
          {error ? (
            <p className="inline-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              type="button"
              className="button quiet"
              disabled={busy}
              onClick={() => (step ? setStep(step - 1) : onClose())}
            >
              {step ? t("back") : t("cancel")}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy || !canContinue}
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1);
                  setError("");
                } else void finish();
              }}
            >
              {busy ? t("working") : step === 3 ? t("finish") : t("next")}
              <ArrowRight size={17} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
