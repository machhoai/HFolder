import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  ChangeInput,
  ChangePreview,
  AppError,
  Project,
  ProjectInput,
  ProjectView,
  Resolution,
} from "@/contracts";

export const desktopAvailable = () =>
  typeof window !== "undefined" && isTauri();
async function call<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!desktopAvailable())
    throw { code: "DESKTOP_REQUIRED", detail: "" } satisfies AppError;
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error) throw error;
    throw { code: "INTERNAL_ERROR", detail: String(error) } satisfies AppError;
  }
}
export const api = {
  previewChanges: (projectId: string, inputs: ChangeInput[]) =>
    call<ChangePreview>("preview_changes", { projectId, inputs }),
  applyChanges: (projectId: string, planId: string) =>
    call<ProjectView>("apply_changes", { projectId, planId }),
  recoverChanges: (projectId: string) =>
    call<ProjectView>("recover_changes", { projectId }),
  projects: () => call<Project[]>("list_projects"),
  chooseRoot: () => call<string | null>("choose_root"),
  createProject: (input: ProjectInput) =>
    call<ProjectView>("create_project", { input }),
  view: (projectId: string) => call<ProjectView>("get_project", { projectId }),
  previewFolder: (projectId: string, parent: string, description: string) =>
    call<string>("preview_folder", { projectId, parent, description }),
  createFolder: (
    projectId: string,
    parent: string,
    description: string,
    kind: string,
    tags: string[],
  ) =>
    call<ProjectView>("create_folder", {
      projectId,
      parent,
      description,
      kind,
      tags,
    }),
  confirm: (projectId: string, resolutions: Resolution[]) =>
    call<ProjectView>("confirm_entries", { projectId, resolutions }),
  open: (projectId: string, relativePath: string, inExplorer = false) =>
    call<void>("open_entry", { projectId, relativePath, inExplorer }),
};
