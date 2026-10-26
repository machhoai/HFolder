use crate::{
    application::{
        ChangeInput, ChangePreview, Engine, Project, ProjectInput, ProjectView, Resolution,
    },
    error::{AppError, AppResult},
    infrastructure::filesystem::scoped_path,
};
use std::{
    collections::HashSet,
    path::Path,
    sync::{Mutex, MutexGuard},
};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

pub struct AppState {
    pub engine: Mutex<Engine>,
    pub chosen_roots: Mutex<HashSet<String>>,
}

fn engine(state: &AppState) -> AppResult<MutexGuard<'_, Engine>> {
    state
        .engine
        .lock()
        .map_err(|_| AppError::new("INTERNAL_ERROR", "Database lock poisoned"))
}

#[tauri::command]
pub async fn choose_root(app: AppHandle, state: State<'_, AppState>) -> AppResult<Option<String>> {
    let selected = app.dialog().file().blocking_pick_folder();
    match selected {
        None => Ok(None),
        Some(file) => {
            let path = file
                .into_path()
                .map_err(|e| AppError::new("INVALID_ROOT", e))?
                .canonicalize()?;
            let path = path.to_string_lossy().to_string();
            state
                .chosen_roots
                .lock()
                .map_err(|_| AppError::new("INTERNAL_ERROR", "Root lock"))?
                .insert(path.clone());
            Ok(Some(path))
        }
    }
}

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> AppResult<Vec<Project>> {
    engine(&state)?.projects()
}

#[tauri::command]
pub async fn create_project(
    input: ProjectInput,
    state: State<'_, AppState>,
) -> AppResult<ProjectView> {
    if !state
        .chosen_roots
        .lock()
        .map_err(|_| AppError::new("INTERNAL_ERROR", "Root lock"))?
        .contains(&input.root)
    {
        return Err(AppError::new(
            "ROOT_NOT_AUTHORIZED",
            "Choose the folder with the native picker first",
        ));
    }
    let mut e = engine(&state)?;
    let p = e.add_project(input)?;
    e.view(&p.id)
}

#[tauri::command]
pub async fn get_project(project_id: String, state: State<'_, AppState>) -> AppResult<ProjectView> {
    engine(&state)?.view(&project_id)
}

#[tauri::command]
pub async fn preview_folder(
    project_id: String,
    parent: String,
    description: String,
    state: State<'_, AppState>,
) -> AppResult<String> {
    engine(&state)?.preview_folder(&project_id, &parent, &description)
}

#[tauri::command]
pub async fn create_folder(
    project_id: String,
    parent: String,
    description: String,
    kind: String,
    tags: Vec<String>,
    state: State<'_, AppState>,
) -> AppResult<ProjectView> {
    engine(&state)?.create_folder(&project_id, &parent, &description, &kind, &tags)
}

#[tauri::command]
pub async fn confirm_entries(
    project_id: String,
    resolutions: Vec<Resolution>,
    state: State<'_, AppState>,
) -> AppResult<ProjectView> {
    engine(&state)?.confirm_entries(&project_id, resolutions)
}

#[tauri::command]
pub async fn open_entry(
    project_id: String,
    relative_path: String,
    in_explorer: bool,
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let e = engine(&state)?;
    let project = e.project(&project_id)?;
    let path = scoped_path(Path::new(&project.root), &relative_path)?;
    drop(e);
    if in_explorer {
        app.opener()
            .reveal_item_in_dir(path)
            .map_err(|e| AppError::new("OPEN_FAILED", e))?;
    } else {
        app.opener()
            .open_path(path.to_string_lossy().to_string(), None::<&str>)
            .map_err(|e| AppError::new("OPEN_FAILED", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn preview_changes(
    project_id: String,
    inputs: Vec<ChangeInput>,
    state: State<'_, AppState>,
) -> AppResult<ChangePreview> {
    engine(&state)?.preview_changes(&project_id, inputs)
}
#[tauri::command]
pub async fn apply_changes(
    project_id: String,
    plan_id: String,
    state: State<'_, AppState>,
) -> AppResult<ProjectView> {
    engine(&state)?.apply_changes(&project_id, &plan_id)
}
#[tauri::command]
pub async fn recover_changes(
    project_id: String,
    state: State<'_, AppState>,
) -> AppResult<ProjectView> {
    engine(&state)?.recover_changes(&project_id)
}
