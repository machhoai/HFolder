"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Folder,
    File,
    FolderPlus,
    ArrowClockwise,
    ListBullets,
    SquaresFour,
    WarningCircle,
    ArrowSquareOut,
    Copy,
    CheckCircle,
    DotsThree,
    MagnifyingGlass,
    X,
} from "@phosphor-icons/react";
import type { Entry, ProjectView } from "@/contracts";
import { useI18n, type MessageKey } from "@/i18n/provider";
import { ancestorIssues, displayPath, fold, selectRange } from "./model";

const issueLabels: Record<string, MessageKey> = {
    MISSING_CODE: "issueMissingCode",
    WRONG_PARENT: "issueWrongParent",
    WRONG_WIDTH: "issueWrongWidth",
    NAME_NOT_NORMALIZED: "issueName",
    DUPLICATE_CODE: "issueDuplicate",
    UNTRACKED: "issueUntracked",
    CHANGED: "issueChanged",
    MISSING: "issueMissing",
};

type Props = {
    view: ProjectView;
    parent: string;
    query: string;
    issuesOnly: boolean;
    onIssuesOnly: (value: boolean) => void;
    onNavigate: (path: string) => void;
    onNew: () => void;
    onRefresh: () => void;
    onOpen: (entry: Entry, reveal?: boolean) => void;
    onCopy: (path: string) => void;
    onRepair: (entries: Entry[], rename: boolean) => void;
    onRecover: () => void;
    onConfirm: (entries: Entry[]) => void;
    busy: boolean;
};

export function Explorer({
    view,
    parent,
    query,
    issuesOnly,
    onIssuesOnly,
    onNavigate,
    onNew,
    onRefresh,
    onOpen,
    onCopy,
    onRepair,
    onRecover,
    onConfirm,
    busy,
}: Props) {
    const { t, locale } = useI18n();
    const [sort, setSort] = useState("name");
    const [grid, setGrid] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const [type, setType] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const anchor = useRef<string | null>(null);
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const entries = useMemo(
        () =>
            view.entries
                .filter(
                    (e) =>
                        (showHidden || !e.hidden) &&
                        (!type || e.kind === type) &&
                        (!issuesOnly || e.issues.length > 0) &&
                        (query
                            ? fold(`${e.name} ${e.relativePath}`).includes(fold(query))
                            : issuesOnly || e.parent === parent),
                )
                .sort(
                    (a, b) =>
                        Number(b.isDir) - Number(a.isDir) ||
                        (sort === "date"
                            ? b.modified - a.modified
                            : a.name.localeCompare(b.name, locale, { numeric: true })),
                ),
        [view.entries, parent, query, issuesOnly, type, showHidden, sort, locale],
    );
    const ids = useMemo(() => entries.map((e) => e.id), [entries]);
    const chosen = view.entries.filter((e) => selected.includes(e.id));
    const virtualizer = useVirtualizer({
        count: grid ? 0 : entries.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 48,
        overscan: 8,
    });
    useEffect(() => {
        setSelected([]);
        anchor.current = null;
        setMenu(null);
    }, [parent, view.project.id, query, issuesOnly, type]);
    useEffect(() => {
        setSelected((current) =>
            current.filter((id) => view.entries.some((e) => e.id === id)),
        );
    }, [view.entries]);
    useEffect(() => {
        if (!menu) return;
        menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        function close(e: PointerEvent) {
            if (!menuRef.current?.contains(e.target as Node)) setMenu(null);
        }
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [menu]);
    function select(e: React.MouseEvent, entry: Entry) {
        scrollRef.current?.focus({ preventScroll: true });
        setSelected((current) =>
            selectRange(
                ids,
                current,
                entry.id,
                anchor.current,
                e.ctrlKey || e.metaKey,
                e.shiftKey,
            ),
        );
        if (!e.shiftKey) anchor.current = entry.id;
    }
    function open(entry: Entry) {
        if (!entry.exists || entry.excluded) return;
        if (entry.isDir) onNavigate(entry.relativePath);
        else onOpen(entry);
    }
    function context(e: React.MouseEvent, entry: Entry) {
        e.preventDefault();
        if (!selected.includes(entry.id)) {
            setSelected([entry.id]);
            anchor.current = entry.id;
        }
        setMenu({
            x: Math.max(8, Math.min(e.clientX, window.innerWidth - 248)),
            y: Math.max(8, Math.min(e.clientY, window.innerHeight - 260)),
        });
    }
    function keys(e: React.KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
            e.preventDefault();
            setSelected(ids);
            return;
        }
        if (e.key === "Escape") {
            setMenu(null);
            setSelected([]);
            return;
        }
        if (e.key === "F2" && canRepair) {
            e.preventDefault();
            onRepair(chosen, true);
            return;
        }
        if (e.key === "Enter" && chosen.length === 1) {
            e.preventDefault();
            open(chosen[0]);
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const current = selected.length
                ? ids.indexOf(selected[selected.length - 1])
                : -1;
            const next = Math.max(
                0,
                Math.min(
                    entries.length - 1,
                    current + (e.key === "ArrowDown" ? 1 : -1),
                ),
            );
            if (entries[next]) {
                setSelected((previous) =>
                    selectRange(
                        ids,
                        previous,
                        ids[next],
                        anchor.current,
                        false,
                        e.shiftKey,
                    ),
                );
                if (!e.shiftKey) anchor.current = ids[next];
                virtualizer.scrollToIndex(next);
            }
        }
    }
    const one = chosen.length === 1 ? chosen[0] : null;
    const canRepair =
        chosen.length > 0 &&
        chosen.every((e) => e.exists && !e.excluded) &&
        !view.recoveryRequired;
    const canConfirm =
        chosen.length > 0 &&
        chosen.some((e) => e.issues.length > 0) &&
        chosen.every(
            (e) =>
                e.exists &&
                !e.excluded &&
                e.issues.every((i) => i === "UNTRACKED" || i === "CHANGED"),
        );
    const formatDate = (n: number) =>
        n
            ? new Intl.DateTimeFormat(locale, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(new Date(n / 1e6))
            : "—";
    const formatSize = (e: Entry) =>
        e.isDir
            ? "—"
            : e.size < 1024
                ? `${e.size} B`
                : e.size < 1024 * 1024
                    ? `${(e.size / 1024).toFixed(1)} KB`
                    : `${(e.size / 1024 / 1024).toFixed(1)} MB`;
    function row(entry: Entry) {
        const Icon = entry.isDir ? Folder : File;
        const count = entry.isDir
            ? ancestorIssues(view.entries, entry.relativePath)
            : entry.issues.length
                ? 1
                : 0;
        return (
            <>
                <div className="entry-name">
                    <Icon
                        size={23}
                        weight={entry.isDir ? "duotone" : "regular"}
                        className={
                            entry.isDir ? "folder-icon text-folder" : "file-icon text-muted"
                        }
                        aria-hidden
                    />
                    <div>
                        <strong title={entry.name}>{entry.name}</strong>
                        {query || issuesOnly ? (
                            <small title={entry.parent}>
                                {entry.parent || view.project.name}
                            </small>
                        ) : null}
                    </div>
                    {count ? (
                        <span
                            className="issue-count flex shrink-0 items-center gap-[3px] text-[10px] text-warning"
                            title={t("needsReview")}
                        >
                            <WarningCircle size={14} aria-hidden />
                            {count}
                        </span>
                    ) : null}
                    {entry.excluded ? (
                        <span className="technical-tag">{t("technical")}</span>
                    ) : null}
                </div>
                <span className="code-cell">{entry.code || "—"}</span>
                <span className="type-cell">
                    {entry.excluded
                        ? t("technical")
                        : view.project.types.find((v) => v.id === entry.kind)?.name ||
                        t("unclassified")}
                </span>
                <span className="date-cell">{formatDate(entry.modified)}</span>
                <span className="size-cell">{formatSize(entry)}</span>
            </>
        );
    }
    return (
        <section
            className="explorer-region flex h-full flex-col"
            aria-label={t("workspace")}
        >
            <div className="toolbar">
                <button
                    className="button primary"
                    onClick={onNew}
                    disabled={busy || view.issueCount > 0 || view.recoveryRequired}
                >
                    <FolderPlus size={19} aria-hidden />
                    {t("new")}
                </button>
                <button
                    className="icon-button"
                    onClick={onRefresh}
                    disabled={busy}
                    title={t("refresh")}
                    aria-label={t("refresh")}
                >
                    <ArrowClockwise
                        size={20}
                        className={busy ? "spin" : ""}
                        aria-hidden
                    />
                </button>
                <span className="toolbar-divider h-[22px] w-[1px] bg-border" />
                <select
                    aria-label={t("sort")}
                    className="compact-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="name">{t("sortName")}</option>
                    <option value="date">{t("sortDate")}</option>
                </select>
                {view.project.types.length ? (
                    <select
                        aria-label={t("type")}
                        className="compact-select"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">{t("allTypes")}</option>
                        {view.project.types.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                ) : null}
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={showHidden}
                        onChange={(e) => setShowHidden(e.target.checked)}
                    />
                    {t("showHidden")}
                </label>
                <div className="view-toggle">
                    <button
                        className={`icon-button ${!grid ? "selected" : ""}`}
                        title={t("listView")}
                        aria-label={t("listView")}
                        aria-pressed={!grid}
                        onClick={() => setGrid(false)}
                    >
                        <ListBullets size={20} aria-hidden />
                    </button>
                    <button
                        className={`icon-button ${grid ? "selected" : ""}`}
                        title={t("gridView")}
                        aria-label={t("gridView")}
                        aria-pressed={grid}
                        onClick={() => setGrid(true)}
                    >
                        <SquaresFour size={20} aria-hidden />
                    </button>
                </div>
            </div>
            {view.recoveryRequired ? (
                <div className="review-banner" role="alert">
                    <WarningCircle size={21} aria-hidden />
                    <p>{t("recoveryHint")}</p>
                    <button disabled={busy} onClick={onRecover}>
                        {t("recoverAction")}
                    </button>
                </div>
            ) : null}
            {view.issueCount ? (
                <div className="review-banner">
                    <WarningCircle size={21} aria-hidden />
                    <p>{t("reviewBanner")}</p>
                    <button onClick={() => onIssuesOnly(!issuesOnly)}>
                        {issuesOnly ? t("allItems") : t("viewIssues")}{" "}
                        <span>{view.issueCount}</span>
                    </button>
                </div>
            ) : null}
            <div className="explorer-main flex min-h-0 flex-1">
                <div className="file-pane">
                    <div className="pane-heading">
                        <div>
                            <p className="eyebrow">
                                {issuesOnly
                                    ? t("needsReview")
                                    : query
                                        ? t("search").replace("…", "")
                                        : t("workspace")}
                            </p>
                            <h1>
                                {issuesOnly
                                    ? t("viewIssues")
                                    : parent
                                        ? parent.split(/[\\/]/).pop()
                                        : view.project.name}
                            </h1>
                        </div>
                        <span className="count-label">
                            {entries.length} {t("items")}
                        </span>
                    </div>
                    {!entries.length ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                {query ? (
                                    <MagnifyingGlass size={38} aria-hidden />
                                ) : (
                                    <FolderPlus size={38} aria-hidden />
                                )}
                            </div>
                            <h2>{query || issuesOnly ? t("noResults") : t("emptyTitle")}</h2>
                            <p>{query || issuesOnly ? t("noResultsText") : t("emptyText")}</p>
                            {!query && !issuesOnly ? (
                                <button
                                    className="button primary"
                                    onClick={onNew}
                                    disabled={
                                        busy || view.issueCount > 0 || view.recoveryRequired
                                    }
                                >
                                    <FolderPlus size={18} aria-hidden />
                                    {t("newFolder")}
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            {!grid ? (
                                <div className="table-header file-columns">
                                    <span>{t("name")}</span>
                                    <span>{t("code")}</span>
                                    <span>{t("type")}</span>
                                    <span>{t("modified")}</span>
                                    <span>{t("size")}</span>
                                </div>
                            ) : null}
                            <div
                                className={`entries-scroll ${grid ? "entry-grid" : ""}`}
                                ref={scrollRef}
                                tabIndex={0}
                                role="listbox"
                                aria-label={t("workspace")}
                                aria-multiselectable="true"
                                onKeyDown={keys}
                            >
                                {grid ? (
                                    entries.map((entry) => (
                                        <div
                                            role="option"
                                            aria-selected={selected.includes(entry.id)}
                                            tabIndex={-1}
                                            key={entry.id}
                                            className={`entry-card ${selected.includes(entry.id) ? "is-selected" : ""}`}
                                            onClick={(e) => select(e, entry)}
                                            onDoubleClick={() => open(entry)}
                                            onContextMenu={(e) => context(e, entry)}
                                        >
                                            {entry.isDir ? (
                                                <Folder
                                                    size={44}
                                                    weight="duotone"
                                                    className="folder-icon text-folder"
                                                    aria-hidden
                                                />
                                            ) : (
                                                <File
                                                    size={44}
                                                    className="file-icon text-muted"
                                                    aria-hidden
                                                />
                                            )}
                                            <strong>{entry.name}</strong>
                                            <small>{entry.code || t("unclassified")}</small>
                                            {entry.issues.length ? (
                                                <WarningCircle
                                                    size={18}
                                                    className="warning"
                                                    aria-label={t("needsReview")}
                                                />
                                            ) : null}
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            height: virtualizer.getTotalSize(),
                                            position: "relative",
                                        }}
                                    >
                                        {virtualizer.getVirtualItems().map((virtual) => {
                                            const entry = entries[virtual.index];
                                            return (
                                                <div
                                                    role="option"
                                                    aria-selected={selected.includes(entry.id)}
                                                    aria-posinset={virtual.index + 1}
                                                    aria-setsize={entries.length}
                                                    key={entry.id}
                                                    className={`entry-row file-columns ${selected.includes(entry.id) ? "is-selected" : ""} ${!entry.exists ? "is-missing" : ""}`}
                                                    style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        width: "100%",
                                                        height: 48,
                                                        transform: `translateY(${virtual.start}px)`,
                                                    }}
                                                    onClick={(e) => select(e, entry)}
                                                    onDoubleClick={() => open(entry)}
                                                    onContextMenu={(e) => context(e, entry)}
                                                >
                                                    {row(entry)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <div className="pane-footer">
                        <span>
                            {entries.length} {t("items")}
                            {selected.length ? ` · ${selected.length} ${t("selected")}` : ""}
                        </span>
                        <span className={view.issueCount ? "warning" : "success"}>
                            {view.issueCount ? (
                                <WarningCircle size={15} aria-hidden />
                            ) : (
                                <CheckCircle size={15} aria-hidden />
                            )}
                            {view.recoveryRequired
                                ? t("recoveryHint")
                                : view.issueCount
                                    ? `${view.issueCount} ${t("needsReview").toLocaleLowerCase()}`
                                    : t("ready")}
                        </span>
                    </div>
                </div>
                <aside className="details-pane">
                    <h2>{t("details")}</h2>
                    {one ? (
                        <>
                            <div className="detail-icon">
                                {one.isDir ? (
                                    <Folder
                                        size={48}
                                        weight="duotone"
                                        className="folder-icon text-folder"
                                        aria-hidden
                                    />
                                ) : (
                                    <File size={48} aria-hidden />
                                )}
                            </div>
                            <h3>{one.name}</h3>
                            <dl>
                                <dt>{t("code")}</dt>
                                <dd className="mono">{one.code || "—"}</dd>
                                <dt>{t("type")}</dt>
                                <dd>
                                    {view.project.types.find((v) => v.id === one.kind)?.name ||
                                        t("unclassified")}
                                </dd>
                                <dt>{t("path")}</dt>
                                <dd className="mono">{one.relativePath}</dd>
                            </dl>
                            {one.issues.length ? (
                                <div className="detail-warning">
                                    <WarningCircle size={18} aria-hidden />
                                    <strong>{t("needsReview")}</strong>
                                    <ul>
                                        {one.issues.map((issue) => (
                                            <li key={issue}>
                                                {issueLabels[issue] ? t(issueLabels[issue]) : issue}
                                            </li>
                                        ))}
                                    </ul>
                                    <p>{t("confirmHint")}</p>
                                </div>
                            ) : null}
                            <button
                                className="button secondary full w-full"
                                disabled={!one.exists || one.excluded}
                                onClick={() => onOpen(one, true)}
                            >
                                <ArrowSquareOut size={18} aria-hidden />
                                {t("reveal")}
                            </button>
                        </>
                    ) : (
                        <div className="detail-empty">
                            <DotsThree size={34} aria-hidden />
                            <p>
                                {chosen.length
                                    ? `${chosen.length} ${t("selected")}`
                                    : t("chooseEntry")}
                            </p>
                        </div>
                    )}
                    {canRepair ? (
                        <button
                            className="button primary full w-full"
                            disabled={busy}
                            onClick={() => onRepair(chosen, false)}
                        >
                            {t("normalizeKeep")}
                        </button>
                    ) : null}
                    {chosen.length ? (
                        <button
                            className="button secondary full w-full"
                            disabled={busy || !canConfirm}
                            title={t("confirmHint")}
                            onClick={() => onConfirm(chosen)}
                        >
                            <CheckCircle size={18} aria-hidden />
                            {t("confirm")}
                        </button>
                    ) : null}
                </aside>
            </div>
            {menu ? (
                <div
                    className="context-menu"
                    ref={menuRef}
                    role="menu"
                    aria-label={t("details")}
                    style={{ left: menu.x, top: menu.y }}
                    onKeyDown={(e) => {
                        const buttons = [
                            ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
                                "button:not(:disabled)",
                            ),
                        ];
                        const index = buttons.indexOf(
                            document.activeElement as HTMLButtonElement,
                        );
                        if (e.key === "Escape") {
                            setMenu(null);
                            scrollRef.current?.focus();
                        }
                        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            e.preventDefault();
                            buttons[
                                (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                                buttons.length
                            ]?.focus();
                        }
                    }}
                >
                    <button
                        role="menuitem"
                        disabled={!one || !one.exists || one.excluded}
                        onClick={() => {
                            if (one) open(one);
                            setMenu(null);
                        }}
                    >
                        <Folder size={18} aria-hidden />
                        {t("open")}
                    </button>
                    <button
                        role="menuitem"
                        disabled={!one || !one.exists || one.excluded}
                        onClick={() => {
                            if (one) onOpen(one, true);
                            setMenu(null);
                        }}
                    >
                        <ArrowSquareOut size={18} aria-hidden />
                        {t("reveal")}
                    </button>
                    <button
                        role="menuitem"
                        disabled={!one}
                        onClick={() => {
                            if (one) onCopy(displayPath(view.project.root, one.relativePath));
                            setMenu(null);
                        }}
                    >
                        <Copy size={18} aria-hidden />
                        {t("copyPath")}
                    </button>
                    <hr />
                    <button
                        role="menuitem"
                        disabled={busy || !canRepair}
                        onClick={() => {
                            onRepair(chosen, false);
                            setMenu(null);
                        }}
                    >
                        {t("normalizeKeep")}
                    </button>
                    <button
                        role="menuitem"
                        disabled={busy || !canRepair}
                        onClick={() => {
                            onRepair(chosen, true);
                            setMenu(null);
                        }}
                    >
                        {t("rename")}
                    </button>
                    <button
                        role="menuitem"
                        disabled={busy || !canConfirm}
                        onClick={() => {
                            onConfirm(chosen);
                            setMenu(null);
                        }}
                    >
                        <CheckCircle size={18} aria-hidden />
                        {t("confirm")}
                    </button>
                    <button className="sr-only" onClick={() => setMenu(null)}>
                        <X aria-hidden />
                        {t("close")}
                    </button>
                </div>
            ) : null}
        </section>
    );
}
