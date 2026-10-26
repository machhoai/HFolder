"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Plus,
    X,
    CaretRight,
    CaretDown,
    Folder,
    Folders,
    GearSix,
    MagnifyingGlass,
    Copy,
    ArrowUp,
    ShieldCheck,
    Hash,
    CheckCircle,
    WarningCircle,
    ArrowRight,
    Moon,
    Sun,
    ArrowSquareOut,
    FolderOpen,
} from "@phosphor-icons/react";
import { api, desktopAvailable } from "@/lib/tauri/client";
import type { Entry, Project, ProjectView } from "@/contracts";
import { readableError, useI18n } from "@/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { ProjectSetup } from "./project-setup";
import { RepairDialog } from "@/features/reconciliation/repair-dialog";
import { NewFolder } from "@/features/explorer/new-folder";
import { Explorer } from "@/features/explorer/explorer";
import { ancestorIssues, displayPath } from "@/features/explorer/model";

type Tab = { id: string; parent: string; query: string; issuesOnly: boolean };

export function HFolderApp() {
    const { t, locale, setLocale } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [active, setActive] = useState<string | null>(null);
    const [views, setViews] = useState<Record<string, ProjectView>>({});
    const [setup, setSetup] = useState(false);
    const [newFolder, setNewFolder] = useState(false);
    const [repair, setRepair] = useState<{
        entries: Entry[];
        rename: boolean;
    } | null>(null);
    const [settings, setSettings] = useState(false);
    const [native, setNative] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
        null,
    );
    const [theme, setTheme] = useState("light");
    const request = useRef(0);
    const searchRef = useRef<HTMLInputElement>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tab = tabs.find((tab) => tab.id === active);
    const view = active ? views[active] : null;
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const notify = useCallback((text: string, error = false) => {
        setToast({ text, error });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), error ? 9000 : 3500);
    }, []);
    const handleError = useCallback(
        (error: unknown) => notify(readableError(error, t), true),
        [notify, t],
    );
    const errorHandler = useRef(handleError);
    useEffect(() => {
        errorHandler.current = handleError;
    }, [handleError]);
    const storeView = useCallback((next: ProjectView) => {
        setViews((current) => ({ ...current, [next.project.id]: next }));
        setProjects((current) => {
            const index = current.findIndex((p) => p.id === next.project.id);
            return index < 0
                ? [...current, next.project]
                : current.map((p) => (p.id === next.project.id ? next.project : p));
        });
    }, []);
    useEffect(() => {
        let alive = true;
        const isNative = desktopAvailable();
        setNative(isNative);
        try {
            const saved = localStorage.getItem("hfolder.theme");
            if (
                saved === "dark" ||
                (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
            )
                setTheme("dark");
        } catch {
            /* preference optional */
        }
        if (!isNative) {
            setLoaded(true);
            return;
        }
        void api
            .projects()
            .then(async (list) => {
                if (!alive) return;
                setProjects(list);
                let saved: Tab[] = [];
                try {
                    const raw = JSON.parse(
                        localStorage.getItem("hfolder.session.v1") || "[]",
                    );
                    if (Array.isArray(raw))
                        saved = raw
                            .filter(
                                (x: Tab) =>
                                    x &&
                                    typeof x.id === "string" &&
                                    list.some((p) => p.id === x.id),
                            )
                            .map((x: Tab) => ({
                                id: x.id,
                                parent: typeof x.parent === "string" ? x.parent : "",
                                query: typeof x.query === "string" ? x.query : "",
                                issuesOnly: !!x.issuesOnly,
                            }));
                } catch {
                    /* invalid session */
                }
                if (!saved.length && list.length)
                    saved = [
                        { id: list[0].id, parent: "", query: "", issuesOnly: false },
                    ];
                setTabs(saved);
                setActive(saved[0]?.id ?? null);
                if (saved.length) {
                    const first = await api.view(saved[0].id);
                    if (alive) storeView(first);
                }
            })
            .catch((e) => {
                if (alive) errorHandler.current(e);
            })
            .finally(() => {
                if (alive) setLoaded(true);
            });
        return () => {
            alive = false;
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, [storeView]);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("hfolder.theme", theme);
        } catch {
            /* preference optional */
        }
    }, [theme]);
    useEffect(() => {
        if (loaded)
            try {
                const ordered = active
                    ? [
                        ...tabs.filter((t) => t.id === active),
                        ...tabs.filter((t) => t.id !== active),
                    ]
                    : tabs;
                localStorage.setItem("hfolder.session.v1", JSON.stringify(ordered));
            } catch {
                /* session optional */
            }
    }, [tabs, active, loaded]);
    const refresh = useCallback(
        async (id: string) => {
            const token = ++request.current;
            setBusy(true);
            try {
                const next = await api.view(id);
                storeView(next);
            } catch (e) {
                handleError(e);
            } finally {
                if (token === request.current) setBusy(false);
            }
        },
        [handleError, storeView],
    );
    useEffect(() => {
        if (active) void refresh(active);
    }, [active, refresh]);
    useEffect(() => {
        function focused() {
            if (active && native && !setup && !newFolder && !repair)
                void refresh(active);
        }
        window.addEventListener("focus", focused);
        return () => window.removeEventListener("focus", focused);
    }, [active, native, setup, newFolder, repair, refresh]);
    function openProject(project: Project) {
        setTabs((current) =>
            current.some((tab) => tab.id === project.id)
                ? current
                : [
                    ...current,
                    { id: project.id, parent: "", query: "", issuesOnly: false },
                ],
        );
        setActive(project.id);
    }
    function updateTab(patch: Partial<Tab>) {
        setTabs((current) =>
            current.map((item) =>
                item.id === active ? { ...item, ...patch } : item,
            ),
        );
    }
    function navigate(parent: string) {
        updateTab({ parent, query: "", issuesOnly: false });
        setExpanded((current) => {
            const next = new Set(current);
            let path = "";
            for (const segment of parent.split(/[\\/]/)) {
                path = path ? `${path}\\${segment}` : segment;
                next.add(path);
            }
            return next;
        });
    }
    async function copy(path: string) {
        try {
            await navigator.clipboard.writeText(path);
            notify(t("copied"));
        } catch (e) {
            handleError(e);
        }
    }
    async function openEntry(entry: Entry, reveal = false) {
        if (!view) return;
        try {
            await api.open(view.project.id, entry.relativePath, reveal);
        } catch (e) {
            handleError(e);
        }
    }
    async function confirm(entries: Entry[]) {
        if (!view) return;
        setBusy(true);
        try {
            storeView(
                await api.confirm(
                    view.project.id,
                    entries.map((e) => ({
                        id: e.id,
                        description: "",
                        kind: e.kind,
                        tags: e.tags,
                    })),
                ),
            );
            notify(t("confirmed"));
        } catch (e) {
            handleError(e);
        } finally {
            setBusy(false);
        }
    }
    useEffect(() => {
        function shortcut(e: KeyboardEvent) {
            if (e.key === "F5") {
                e.preventDefault();
                if (active) void refresh(active);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (
                (e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                e.key.toLowerCase() === "n" &&
                !setup &&
                !settings
            ) {
                e.preventDefault();
                if (view && !view.issueCount && !view.recoveryRequired)
                    setNewFolder(true);
            }
        }
        window.addEventListener("keydown", shortcut);
        return () => window.removeEventListener("keydown", shortcut);
    }, [active, refresh, setup, settings, view]);
    const segments = tab?.parent.split(/[\\/]/).filter(Boolean) || [];
    function tree(parent: string, depth = 0): React.ReactNode {
        return view?.entries
            .filter(
                (e) =>
                    e.isDir &&
                    e.exists &&
                    !e.excluded &&
                    !e.hidden &&
                    e.parent === parent,
            )
            .map((entry) => {
                const count = ancestorIssues(view.entries, entry.relativePath);
                const isExpanded = expanded.has(entry.relativePath);
                return (
                    <div key={entry.id}>
                        <div
                            className={`tree-row ${tab?.parent === entry.relativePath ? "active" : ""}`}
                            style={{ paddingLeft: 12 + depth * 16 }}
                        >
                            <button
                                className="tree-caret"
                                aria-label={`${isExpanded ? t("close") : t("open")}: ${entry.name}`}
                                aria-expanded={isExpanded}
                                onClick={() =>
                                    setExpanded((current) => {
                                        const next = new Set(current);
                                        if (next.has(entry.relativePath))
                                            next.delete(entry.relativePath);
                                        else next.add(entry.relativePath);
                                        return next;
                                    })
                                }
                            >
                                {isExpanded ? (
                                    <CaretDown size={12} aria-hidden />
                                ) : (
                                    <CaretRight size={12} aria-hidden />
                                )}
                            </button>
                            <button
                                className="tree-label"
                                onClick={() => navigate(entry.relativePath)}
                            >
                                <Folder size={17} weight="duotone" aria-hidden />
                                <span title={entry.name}>{entry.name}</span>
                                {count ? <span className="tree-badge">{count}</span> : null}
                            </button>
                        </div>
                        {isExpanded ? tree(entry.relativePath, depth + 1) : null}
                    </div>
                );
            });
    }
    return (
        <div
            className="app-shell flex h-dvh min-w-190 flex-col overflow-hidden"
            onContextMenu={(e) => {
                if (
                    !(e.target instanceof HTMLInputElement) &&
                    !(e.target instanceof HTMLTextAreaElement)
                )
                    e.preventDefault();
            }}
        >
            <a className="skip-link" href="#main-content">
                {t("skip")}
            </a>
            <header className="tab-bar">
                <div className="brand">
                    <img src="/hfolder.svg" width={29} height={29} alt="" />
                    <strong>HFolder</strong>
                    <span className="beta-label">DEV</span>
                </div>
                <div className="tabs mr-2" role="tablist" aria-label={t("projects")}>
                    {tabs.map((item) => {
                        const project = projects.find((p) => p.id === item.id);
                        return (
                            <div
                                className={`project-tab border border-solid overflow-hidden relative  ${active === item.id ? "active" : ""}`}
                                key={item.id}
                            >
                                <button
                                    role="tab"
                                    aria-selected={active === item.id}
                                    onClick={() => setActive(item.id)}
                                    className="flex-1"
                                >
                                    <Folder size={17} aria-hidden />
                                    <span>{project?.name || "…"}</span>
                                    {views[item.id]?.issueCount ? (
                                        <WarningCircle
                                            size={15}
                                            className="warning"
                                            aria-label={t("needsReview")}
                                        />
                                    ) : null}
                                </button>
                                <button
                                    className="tab-close absolute right-1"
                                    aria-label={`${t("deleteTab")}: ${project?.name}`}
                                    onClick={() => {
                                        setTabs((current) =>
                                            current.filter((t) => t.id !== item.id),
                                        );
                                        if (active === item.id)
                                            setActive(tabs.find((t) => t.id !== item.id)?.id ?? null);
                                    }}
                                >
                                    <X size={13} aria-hidden />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        className="icon-button add-tab"
                        title={t("newProject")}
                        aria-label={t("newProject")}
                        onClick={() => setSetup(true)}
                        disabled={!native}
                    >
                        <Plus size={20} aria-hidden />
                    </button>
                </div>
                <button
                    className="icon-button settings-top"
                    title={t("settings")}
                    aria-label={t("settings")}
                    onClick={() => setSettings(true)}
                >
                    <GearSix size={21} aria-hidden />
                </button>
            </header>
            <div className="location-bar">
                <div className="breadcrumbs flex min-w-0 flex-1 items-center gap-[5px]">
                    <button
                        className="icon-button"
                        aria-label={t("up")}
                        disabled={!tab?.parent}
                        onClick={() => navigate(segments.slice(0, -1).join("\\"))}
                    >
                        <ArrowUp size={18} aria-hidden />
                    </button>
                    <span className="location-divider" />
                    <button
                        className="breadcrumb root-crumb shrink-0 font-semibold"
                        onClick={() => navigate("")}
                        disabled={!view}
                    >
                        <Folders size={18} aria-hidden />
                        {view?.project.name || t("workspace")}
                    </button>
                    {segments.map((segment, index) => (
                        <span className="crumb-segment" key={index}>
                            <CaretRight size={12} aria-hidden />
                            <button
                                className="breadcrumb"
                                title={segment}
                                onClick={() =>
                                    navigate(segments.slice(0, index + 1).join("\\"))
                                }
                            >
                                {segment}
                            </button>
                        </span>
                    ))}
                    <button
                        className="icon-button copy-location ml-auto"
                        aria-label={t("copyPath")}
                        title={t("copyPath")}
                        disabled={!view}
                        onClick={() => {
                            if (view)
                                void copy(displayPath(view.project.root, tab?.parent || ""));
                        }}
                    >
                        <Copy size={17} aria-hidden />
                    </button>
                </div>
                <div className="search-box">
                    <MagnifyingGlass size={18} aria-hidden />
                    <input
                        ref={searchRef}
                        aria-label={t("search")}
                        placeholder={t("search")}
                        value={tab?.query || ""}
                        disabled={!view}
                        onChange={(e) => updateTab({ query: e.target.value })}
                    />
                    {tab?.query ? (
                        <button
                            className="icon-button"
                            aria-label={t("clearSearch")}
                            onClick={() => updateTab({ query: "" })}
                        >
                            <X size={14} aria-hidden />
                        </button>
                    ) : (
                        <kbd>Ctrl F</kbd>
                    )}
                </div>
            </div>
            <div className="workspace-body flex min-h-0 flex-1">
                <aside className="sidebar">
                    {!projects.length ? (
                        <span className="sidebar-empty my-auto text-center items-center justify-center">{t("noProjects")}</span>
                    ) : null}
                    {view ? (
                        <>
                            <div className="sidebar-heading tree-heading mt-7">
                                <span>{t("folders")}</span>
                            </div>
                            <nav aria-label={t("folders")} className="folder-tree">
                                <button
                                    className={`tree-root ${!tab?.parent ? "active" : ""}`}
                                    onClick={() => navigate("")}
                                >
                                    <FolderOpen size={18} aria-hidden />
                                    <span>{view.project.name}</span>
                                    {view.issueCount ? (
                                        <span className="tree-badge">{view.issueCount}</span>
                                    ) : null}
                                </button>
                                {tree("")}
                            </nav>
                        </>
                    ) : null}
                    <div className="sidebar-bottom">
                        <p className="text-center">{t("milestone")}</p>
                    </div>
                </aside>
                <main id="main-content" className="main-content" tabIndex={-1}>
                    {view && tab ? (
                        <Explorer
                            view={view}
                            parent={tab.parent}
                            query={tab.query}
                            issuesOnly={tab.issuesOnly}
                            onIssuesOnly={(value) => updateTab({ issuesOnly: value })}
                            onNavigate={navigate}
                            onNew={() => setNewFolder(true)}
                            onRefresh={() => void refresh(view.project.id)}
                            onOpen={(entry, reveal) => void openEntry(entry, reveal)}
                            onCopy={(path) => void copy(path)}
                            onRepair={(entries, rename) => setRepair({ entries, rename })}
                            onRecover={() => {
                                setBusy(true);
                                void api
                                    .recoverChanges(view.project.id)
                                    .then(storeView)
                                    .catch(handleError)
                                    .finally(() => setBusy(false));
                            }}
                            onConfirm={(entries) => void confirm(entries)}
                            busy={busy}
                        />
                    ) : (
                        <div className="welcome-page">
                            <div className="welcome-heading">
                                <p className="eyebrow">
                                    HFOLDER / {t("workspace").toUpperCase()}
                                </p>
                                <h1>{t("welcomeTitle")}</h1>
                                <p>{t("welcomeText")}</p>
                            </div>
                            {!native && loaded ? (
                                <div className="browser-notice">
                                    <WarningCircle size={19} aria-hidden />
                                    <span>{t("desktopNotice")}</span>
                                </div>
                            ) : null}
                            <div className="start-card">
                                <div className="start-card-icon">
                                    <Folders size={38} weight="duotone" aria-hidden />
                                </div>
                                <div>
                                    <h2>{t("start")}</h2>
                                    <p>{t("startText")}</p>
                                </div>
                                <button
                                    className="button primary"
                                    disabled={!native || !loaded}
                                    onClick={() => setSetup(true)}
                                >
                                    <Plus size={18} aria-hidden />
                                    {t("createProject")}
                                    <ArrowRight size={17} aria-hidden />
                                </button>
                            </div>
                            {projects.length ? (
                                <section className="recent-section">
                                    <h2>{t("continueProject")}</h2>
                                    <div className="recent-grid">
                                        {projects.map((project) => (
                                            <button
                                                className="recent-card"
                                                key={project.id}
                                                onClick={() => openProject(project)}
                                            >
                                                <Folder size={25} weight="duotone" aria-hidden />
                                                <strong>{project.name}</strong>
                                                <span title={project.root}>
                                                    {displayPath(project.root, "")}
                                                </span>
                                                <ArrowSquareOut size={17} aria-hidden />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                            <div className="welcome-benefits">
                                {[
                                    { Icon: Hash, title: t("rulesTitle"), text: t("rulesText") },
                                    {
                                        Icon: ShieldCheck,
                                        title: t("privacyTitle"),
                                        text: t("privacyText"),
                                    },
                                    { Icon: Folders, title: t("flexTitle"), text: t("flexText") },
                                ].map(({ Icon, title, text }) => (
                                    <div key={title}>
                                        <Icon size={23} aria-hidden />
                                        <h3>{title}</h3>
                                        <p>{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="welcome-foot">
                                <span className="small-brand">H</span>
                                <span>
                                    HFolder <span className="muted">/ 0.2.0</span>
                                </span>
                                <span className="welcome-foot-right">
                                    <CheckCircle size={15} aria-hidden />
                                    {t("local")}
                                </span>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {toast ? (
                <div
                    className={`toast ${toast.error ? "toast-error" : ""}`}
                    role={toast.error ? "alert" : "status"}
                >
                    {toast.error ? (
                        <WarningCircle size={20} aria-hidden />
                    ) : (
                        <CheckCircle size={20} aria-hidden />
                    )}
                    <span>{toast.text}</span>
                    <button
                        className="icon-button"
                        aria-label={t("close")}
                        onClick={() => setToast(null)}
                    >
                        <X size={16} aria-hidden />
                    </button>
                </div>
            ) : null}
            {setup ? (
                <ProjectSetup
                    projects={projects}
                    onClose={() => setSetup(false)}
                    onCreated={(next) => {
                        storeView(next);
                        openProject(next.project);
                        setSetup(false);
                        notify(t("projectCreated"));
                    }}
                />
            ) : null}
            {repair && view ? (
                <RepairDialog
                    view={view}
                    entries={repair.entries}
                    rename={repair.rename}
                    onClose={() => setRepair(null)}
                    onApplied={(next, changes) => {
                        const location = changes.find((row) => row.before === tab?.parent);
                        storeView(next);
                        if (location) updateTab({ parent: location.after });
                        setRepair(null);
                        notify(t("changesApplied"));
                    }}
                />
            ) : null}
            {newFolder && view ? (
                <NewFolder
                    project={view.project}
                    parent={tab?.parent || ""}
                    onClose={() => setNewFolder(false)}
                    onCreated={(next) => {
                        storeView(next);
                        setNewFolder(false);
                        notify(t("created"));
                    }}
                />
            ) : null}
            {settings ? (
                <Dialog title={t("settings")} wide onClose={() => setSettings(false)}>
                    <div className="settings-body">
                        <section>
                            <h3>{t("language")}</h3>
                            <select
                                aria-label={t("language")}
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as "vi-VN" | "en")}
                            >
                                <option value="vi-VN">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </section>
                        <section>
                            <h3>{t("theme")}</h3>
                            <div className="button-row flex flex-wrap gap-2">
                                <button
                                    className={`button ${theme === "light" ? "primary" : "secondary"}`}
                                    aria-pressed={theme === "light"}
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun size={19} aria-hidden />
                                    {t("light")}
                                </button>
                                <button
                                    className={`button ${theme === "dark" ? "primary" : "secondary"}`}
                                    aria-pressed={theme === "dark"}
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon size={19} aria-hidden />
                                    {t("dark")}
                                </button>
                            </div>
                        </section>
                        <section>
                            <h3>{t("checkUpdates")}</h3>
                            <p>{t("updateUnavailable")}</p>
                        </section>
                        <section>
                            <h3>
                                HFolder <span className="version-badge">0.2.0</span>
                            </h3>
                            <p>{t("scopeNotice")}</p>
                        </section>
                    </div>
                </Dialog>
            ) : null}
        </div>
    );
}
