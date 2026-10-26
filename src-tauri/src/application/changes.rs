use super::*;
use std::path::PathBuf;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeInput {
    pub id: String,
    pub description: Option<String>,
    pub number: Option<u64>,
    pub kind: Option<String>,
    pub tags: Option<Vec<String>>,
}
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeRow {
    pub entry_id: String,
    pub before: String,
    pub after: String,
    pub code: String,
    pub kind: String,
    pub tags: Vec<String>,
}
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangePreview {
    pub id: String,
    pub changes: Vec<ChangeRow>,
}
#[derive(Serialize, Deserialize)]
struct Step {
    before: String,
    after: String,
    identity: String,
}
#[derive(Serialize, Deserialize)]
struct Plan {
    signature: String,
    changes: Vec<ChangeRow>,
    steps: Vec<Step>,
    identities: Vec<(String, String)>,
}

fn join(parent: &str, name: &str) -> String {
    Path::new(parent).join(name).to_string_lossy().into_owned()
}
fn parts(name: &str) -> Option<Vec<u64>> {
    code_parts(name).map(|v| v.0)
}
fn signature(entries: &[Entry]) -> AppResult<String> {
    let mut sorted = entries.to_vec();
    sorted.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    encode(&sorted)
}

// Stable filesystem object identity prevents recovery from renaming an unrelated
// object placed at a journal path after a crash. Reparse points are rejected first.
#[cfg(windows)]
fn identity(path: &Path) -> AppResult<String> {
    use std::{
        mem::MaybeUninit,
        os::windows::{fs::OpenOptionsExt, io::AsRawHandle},
    };
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION, FILE_FLAG_BACKUP_SEMANTICS,
    };
    if is_link(&fs::symlink_metadata(path)?) {
        return Err(AppError::new("LINK_NOT_SUPPORTED", path.display()));
    }
    let file = fs::OpenOptions::new()
        .read(true)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS)
        .open(path)?;
    let mut info = MaybeUninit::<BY_HANDLE_FILE_INFORMATION>::uninit();
    if unsafe { GetFileInformationByHandle(file.as_raw_handle(), info.as_mut_ptr()) } == 0 {
        return Err(std::io::Error::last_os_error().into());
    }
    let info = unsafe { info.assume_init() };
    Ok(format!(
        "{}:{}:{}",
        info.dwVolumeSerialNumber, info.nFileIndexHigh, info.nFileIndexLow
    ))
}
#[cfg(not(windows))]
fn identity(_path: &Path) -> AppResult<String> {
    Err(AppError::new(
        "UNSUPPORTED_PLATFORM",
        "Rename currently requires Windows",
    ))
}

#[cfg(windows)]
fn rename_no_replace(from: &Path, to: &Path) -> AppResult<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_WRITE_THROUGH};
    let from: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
    let to: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
    if unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), MOVEFILE_WRITE_THROUGH) } == 0 {
        return Err(std::io::Error::last_os_error().into());
    }
    Ok(())
}
#[cfg(not(windows))]
fn rename_no_replace(_from: &Path, _to: &Path) -> AppResult<()> {
    Err(AppError::new(
        "UNSUPPORTED_PLATFORM",
        "Rename currently requires Windows",
    ))
}

impl Engine {
    pub fn has_pending_changes(&self, id: &str) -> AppResult<bool> {
        Ok(self.db.query_row(
            "SELECT EXISTS(SELECT 1 FROM change_plans WHERE project_id=?1 AND status='running')",
            [id],
            |r| r.get(0),
        )?)
    }
    pub fn preview_changes(
        &mut self,
        id: &str,
        inputs: Vec<ChangeInput>,
    ) -> AppResult<ChangePreview> {
        let view = self.view(id)?;
        if view.recovery_required {
            return Err(AppError::new("RECOVERY_REQUIRED", id));
        }
        if inputs.is_empty() {
            return Err(AppError::new(
                "INVALID_SELECTION",
                "Select at least one item",
            ));
        }
        let selected: HashMap<_, _> = inputs.iter().map(|i| (i.id.clone(), i)).collect();
        if selected.len() != inputs.len() {
            return Err(AppError::new("INVALID_SELECTION", "Duplicate selection"));
        }
        for input in &inputs {
            let entry = view
                .entries
                .iter()
                .find(|e| e.id == input.id)
                .ok_or_else(|| AppError::new("ENTRY_NOT_FOUND", &input.id))?;
            if entry.excluded || !entry.exists {
                return Err(AppError::new("INVALID_SELECTION", &entry.name));
            }
            Self::validate_metadata(
                &view.project,
                input.kind.as_deref().unwrap_or(&entry.kind),
                input.tags.as_deref().unwrap_or(&entry.tags),
            )?;
        }
        let selected_folders: Vec<_> = view
            .entries
            .iter()
            .filter(|e| e.is_dir && selected.contains_key(&e.id))
            .map(|e| PathBuf::from(&e.relative_path))
            .collect();
        let affected = |e: &Entry| {
            selected.contains_key(&e.id)
                || selected_folders
                    .iter()
                    .any(|p| Path::new(&e.relative_path).starts_with(p))
        };
        let mut entries: Vec<_> = view
            .entries
            .iter()
            .filter(|e| e.exists && !e.excluded)
            .collect();
        entries.sort_by_key(|e| {
            (
                Path::new(&e.relative_path).components().count(),
                e.relative_path.clone(),
            )
        });
        let mut mapped: HashMap<String, (String, Vec<u64>)> = HashMap::new();
        mapped.insert(String::new(), (String::new(), vec![]));
        let mut changes = Vec::new();
        let mut used = HashMap::<String, String>::new();
        let mut high = HashMap::<String, u64>::new();
        for e in &entries {
            if let Some(p) = parts(&e.name) {
                let n = *p.last().unwrap();
                high.entry(e.parent.clone())
                    .and_modify(|v| *v = (*v).max(n))
                    .or_insert(n);
            }
            if !affected(e) {
                if let Some(p) = parts(&e.name) {
                    used.insert(code_key(&p), e.id.clone());
                }
            }
        }
        for e in entries {
            if !affected(e) {
                if let Some(p) = parts(&e.name) {
                    mapped.insert(e.relative_path.clone(), (e.relative_path.clone(), p));
                }
                continue;
            }
            let (new_parent, parent_parts) = mapped
                .get(&e.parent)
                .ok_or_else(|| {
                    AppError::new(
                        "INVALID_PARENT",
                        "Select and normalize the parent folder first",
                    )
                })?
                .clone();
            let input = selected.get(&e.id);
            let old = parts(&e.name);
            let existing = old.as_ref().and_then(|p| p.last()).copied();
            let reserved = self
                .db
                .query_row(
                    "SELECT high_water FROM counters WHERE project_id=?1 AND parent_key=?2",
                    params![id, code_key(&parent_parts)],
                    |r| r.get::<_, u64>(0),
                )
                .optional()?
                .unwrap_or(0);
            let top = high.entry(e.parent.clone()).or_default();
            *top = (*top).max(reserved);
            let increment = |high: u64| {
                high.checked_add(1)
                    .ok_or_else(|| AppError::new("CODE_OVERFLOW", "Code number is too large"))
            };
            let mut number = match input.and_then(|i| i.number).or(existing) {
                Some(number) => number,
                None => increment(*top)?,
            };
            let mut code_parts = parent_parts.clone();
            code_parts.push(number);
            if input.and_then(|i| i.number).is_none()
                && (e.issues.iter().any(|i| i == "DUPLICATE_CODE")
                    || used.contains_key(&code_key(&code_parts)))
            {
                number = increment(*top)?;
                *code_parts.last_mut().unwrap() = number;
            }
            *top = (*top).max(number);
            let code = render_code(&code_parts, &view.project.widths)?;
            let key = code_key(&code_parts);
            if used.insert(key.clone(), e.id.clone()).is_some() {
                return Err(AppError::new("DUPLICATE_CODE", code));
            }
            let owner: Option<String> = self
                .db
                .query_row(
                    "SELECT id FROM entries WHERE project_id=?1 AND code_key=?2",
                    params![id, key],
                    |r| r.get(0),
                )
                .optional()?;
            if owner.as_ref().is_some_and(|owner| {
                owner != &e.id
                    && !view
                        .entries
                        .iter()
                        .any(|other| &other.id == owner && affected(other) && other.exists)
            }) {
                return Err(AppError::new("DUPLICATE_CODE", code));
            }
            let (description, extension) = description_of(&e.name, e.is_dir);
            let description = input
                .and_then(|i| i.description.as_deref())
                .unwrap_or(&description);
            let name = filename(&code, description, extension.as_deref())?;
            let target = join(&new_parent, &name);
            let row = ChangeRow {
                entry_id: e.id.clone(),
                before: e.relative_path.clone(),
                after: target.clone(),
                code,
                kind: input.and_then(|i| i.kind.clone()).unwrap_or(e.kind.clone()),
                tags: input.and_then(|i| i.tags.clone()).unwrap_or(e.tags.clone()),
            };
            changes.push(row);
            mapped.insert(e.relative_path.clone(), (target, code_parts));
        }
        if changes.len() > 500 {
            return Err(AppError::new("BATCH_TOO_LARGE", changes.len()));
        }
        // Renaming deepest-first changes each basename while its old parent still
        // exists. Ancestor steps then carry the subtree, including excluded metadata.
        let mut steps = Vec::new();
        for row in &changes {
            let name = Path::new(&row.after)
                .file_name()
                .ok_or_else(|| AppError::new("INVALID_NAME", &row.after))?
                .to_string_lossy();
            let destination = join(&parent_of(&row.before), &name);
            if row.before != destination {
                let from = scoped_path(Path::new(&view.project.root), &row.before)?;
                let to = Path::new(&view.project.root).join(&destination);
                if to.try_exists()? && row.before.to_lowercase() != destination.to_lowercase() {
                    return Err(AppError::new("TARGET_EXISTS", destination));
                }
                let fingerprint = identity(&from)?;
                if row.before.to_lowercase() == destination.to_lowercase() {
                    let temporary = join(
                        &parent_of(&row.before),
                        &format!(".hfolder-stage-{}", Uuid::new_v4()),
                    );
                    steps.push(Step {
                        before: row.before.clone(),
                        after: temporary.clone(),
                        identity: fingerprint.clone(),
                    });
                    steps.push(Step {
                        before: temporary,
                        after: destination,
                        identity: fingerprint,
                    });
                } else {
                    steps.push(Step {
                        before: row.before.clone(),
                        after: destination,
                        identity: fingerprint,
                    });
                }
            }
        }
        steps.sort_by_key(|s| std::cmp::Reverse(Path::new(&s.before).components().count()));
        let plan = Plan {
            signature: signature(&view.entries)?,
            changes: changes.clone(),
            steps,
            identities: changes
                .iter()
                .map(|r| {
                    Ok((
                        r.before.clone(),
                        identity(&scoped_path(Path::new(&view.project.root), &r.before)?)?,
                    ))
                })
                .collect::<AppResult<_>>()?,
        };
        let plan_id = Uuid::new_v4().to_string();
        // Preview does not reserve codes or change files. Only its opaque id can be applied.
        self.db.execute("INSERT INTO change_plans(id,project_id,payload,status,created_at) VALUES(?1,?2,?3,'preview',?4)",params![plan_id,id,encode(&plan)?,time_now()])?;
        self.db.execute(
            "DELETE FROM change_plans WHERE project_id=?1 AND status='preview' AND created_at < ?2",
            params![id, time_now().saturating_sub(86400)],
        )?;
        Ok(ChangePreview {
            id: plan_id,
            changes,
        })
    }
    fn load_change_plan(
        &self,
        id: &str,
        plan_id: &str,
    ) -> AppResult<(Plan, String, usize, Option<usize>)> {
        let (payload,status,progress,inflight): (String,String,usize,Option<usize>)=self.db.query_row("SELECT payload,status,progress,inflight FROM change_plans WHERE id=?1 AND project_id=?2",params![plan_id,id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?)))?;
        Ok((decode(payload)?, status, progress, inflight))
    }
    pub fn apply_changes(&mut self, id: &str, plan_id: &str) -> AppResult<ProjectView> {
        let (plan, status, _, _) = self.load_change_plan(id, plan_id)?;
        if status != "preview" {
            return Err(AppError::new("INVALID_PLAN", status));
        }
        let view = self.view(id)?;
        if view.recovery_required {
            return Err(AppError::new("RECOVERY_REQUIRED", id));
        }
        if signature(&view.entries)? != plan.signature {
            return Err(AppError::new(
                "STALE_PREVIEW",
                "Refresh the preview; project files changed",
            ));
        }
        // Validate object identity even if an outside program preserved size/mtime.
        for (relative, expected) in &plan.identities {
            if identity(&scoped_path(Path::new(&view.project.root), relative)?)? != *expected {
                return Err(AppError::new("STALE_PREVIEW", relative));
            }
        }
        self.db.execute(
            "UPDATE change_plans SET status='running' WHERE id=?1",
            [plan_id],
        )?;
        let result = self.execute_change_steps(id, plan_id, &plan, usize::MAX);
        if let Err(error) = result {
            if self.recover_changes(id).is_err() {
                return Err(AppError::new(
                    "RECOVERY_REQUIRED",
                    format!("{}: {}", error.code, error.detail),
                ));
            }
            return Err(error);
        }
        self.view(id)
    }
    fn execute_change_steps(
        &mut self,
        id: &str,
        plan_id: &str,
        plan: &Plan,
        fail_after: usize,
    ) -> AppResult<()> {
        let project = self.project(id)?;
        for (index, step) in plan.steps.iter().enumerate() {
            if index == fail_after {
                return Err(AppError::new("INJECTED_FAILURE", "Test interruption"));
            }
            self.db.execute(
                "UPDATE change_plans SET inflight=?2 WHERE id=?1",
                params![plan_id, index],
            )?;
            let source = scoped_path(Path::new(&project.root), &step.before)?;
            if identity(&source)? != step.identity {
                return Err(AppError::new("STALE_PREVIEW", &step.before));
            }
            let parent = scoped_path(Path::new(&project.root), &parent_of(&step.after))?;
            let target = parent.join(Path::new(&step.after).file_name().unwrap());
            rename_no_replace(&source, &target)?;
            self.db.execute(
                "UPDATE change_plans SET progress=?2,inflight=NULL WHERE id=?1",
                params![plan_id, index + 1],
            )?;
        }
        // Filesystem and SQLite cannot share a transaction. The durable running
        // journal survives until every registry update commits in one SQL transaction.
        self.db.execute_batch("BEGIN IMMEDIATE")?;
        let result = (|| -> AppResult<()> {
            for row in &plan.changes {
                self.db.execute(
                    "UPDATE entries SET relative_path=?2,code=NULL,code_key=NULL WHERE id=?1",
                    params![row.entry_id, format!(":change:{plan_id}:{}", row.entry_id)],
                )?;
            }
            for row in &plan.changes {
                self.snapshot(id, &row.entry_id, &row.after, &row.kind, &row.tags)?;
            }
            self.db.execute(
                "UPDATE change_plans SET status='completed',inflight=NULL WHERE id=?1",
                [plan_id],
            )?;
            Ok(())
        })();
        match result {
            Ok(()) => {
                if let Err(error) = self.db.execute_batch("COMMIT") {
                    let _ = self.db.execute_batch("ROLLBACK");
                    return Err(error.into());
                }
                Ok(())
            }
            Err(error) => {
                self.db.execute_batch("ROLLBACK")?;
                Err(error)
            }
        }
    }
    pub fn recover_changes(&mut self, id: &str) -> AppResult<ProjectView> {
        let pending: Option<String> = self
            .db
            .query_row(
                "SELECT id FROM change_plans WHERE project_id=?1 AND status='running'",
                [id],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(plan_id) = pending {
            let (plan, _, progress, inflight) = self.load_change_plan(id, &plan_id)?;
            let project = self.project(id)?;
            let count = inflight.map_or(progress, |i| progress.max(i + 1));
            for step in plan.steps.iter().take(count).rev() {
                let root = Path::new(&project.root);
                let from = root.join(&step.before);
                let to = root.join(&step.after);
                // A prior recovery may itself have been interrupted. Original identity
                // at source means this step is already rolled back.
                let at_source = from.try_exists()?
                    && identity(&scoped_path(root, &step.before)?)? == step.identity;
                if at_source {
                    continue;
                }
                if from.try_exists()? || !to.try_exists()? {
                    return Err(AppError::new("RECOVERY_CONFLICT", &step.before));
                }
                let destination = scoped_path(root, &step.after)?;
                if identity(&destination)? != step.identity {
                    return Err(AppError::new("RECOVERY_CONFLICT", &step.after));
                }
                let parent = scoped_path(root, &parent_of(&step.before))?;
                rename_no_replace(
                    &destination,
                    &parent.join(Path::new(&step.before).file_name().unwrap()),
                )?;
            }
            self.db.execute(
                "UPDATE change_plans SET status='rolled_back',inflight=NULL WHERE id=?1",
                [plan_id],
            )?;
        }
        self.view(id)
    }
}

#[cfg(all(test, windows))]
mod tests {
    use super::*;
    fn setup() -> (tempfile::TempDir, Engine, Project) {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("root");
        fs::create_dir(&root).unwrap();
        let mut engine = Engine {
            db: crate::infrastructure::persistence::open_database(&temp.path().join("app.db"))
                .unwrap(),
        };
        let project = engine
            .add_project(ProjectInput {
                name: "Test".into(),
                root: root.to_string_lossy().into(),
                widths: vec![2, 2, 3],
                types: vec![],
                tags: vec![],
            })
            .unwrap();
        (temp, engine, project)
    }
    fn input(id: &str) -> ChangeInput {
        ChangeInput {
            id: id.into(),
            description: None,
            number: None,
            kind: None,
            tags: None,
        }
    }
    #[test]
    fn normalize_existing_tree_preserves_content_extensionless_shortcuts_and_technical_data() {
        let (_tmp, mut e, p) = setup();
        let root = Path::new(&p.root);
        fs::create_dir(root.join("Hồ sơ")).unwrap();
        for name in ["hóa đơn.pdf", "README", "link.lnk", "desktop.ini"] {
            fs::write(root.join("Hồ sơ").join(name), name).unwrap();
        }
        let view = e.view(&p.id).unwrap();
        let folder = view.entries.iter().find(|v| v.is_dir).unwrap();
        let folder_id = folder.id.clone();
        let preview = e.preview_changes(&p.id, vec![input(&folder.id)]).unwrap();
        assert_eq!(preview.changes.len(), 4);
        assert!(root.join("Hồ sơ").exists());
        let after = e.apply_changes(&p.id, &preview.id).unwrap();
        assert_eq!(after.issue_count, 0);
        assert_eq!(
            after
                .entries
                .iter()
                .find(|v| v.name == "01 Ho_so")
                .unwrap()
                .id,
            folder_id
        );
        assert!(root.join("01 Ho_so/desktop.ini").exists());
        for row in preview.changes.iter().filter(|r| r.entry_id != folder_id) {
            let old = Path::new(&row.before)
                .file_name()
                .unwrap()
                .to_string_lossy();
            assert_eq!(fs::read_to_string(root.join(&row.after)).unwrap(), old);
            if old == "README" {
                assert_eq!(
                    description_of(
                        Path::new(&row.after).file_name().unwrap().to_str().unwrap(),
                        false
                    )
                    .1,
                    None
                );
            }
        }
    }
    #[test]
    fn parent_code_cascades_and_registry_identity_survives_reopen() {
        let (tmp, mut e, p) = setup();
        e.create_folder(&p.id, "", "Hóa đơn", "", &[]).unwrap();
        let view = e
            .create_folder(&p.id, "01 Hoa_don", "Đợt 1", "", &[])
            .unwrap();
        let parent = view
            .entries
            .iter()
            .find(|v| v.name == "01 Hoa_don")
            .unwrap();
        let mut change = input(&parent.id);
        change.number = Some(3);
        change.description = Some("Tài chính".into());
        let preview = e.preview_changes(&p.id, vec![change]).unwrap();
        assert!(preview
            .changes
            .iter()
            .any(|r| Path::new(&r.after) == Path::new("03 Tai_chinh").join("03.01 Dot_1")));
        e.apply_changes(&p.id, &preview.id).unwrap();
        drop(e);
        let mut e = Engine {
            db: crate::infrastructure::persistence::open_database(&tmp.path().join("app.db"))
                .unwrap(),
        };
        let after = e.view(&p.id).unwrap();
        assert_eq!(after.issue_count, 0);
        for row in preview.changes {
            assert!(after
                .entries
                .iter()
                .any(|v| v.id == row.entry_id && v.relative_path == row.after));
        }
        let next = e
            .create_folder(&p.id, "03 Tai_chinh", "Đợt 2", "", &[])
            .unwrap();
        assert!(next
            .entries
            .iter()
            .any(|v| v.code.as_deref() == Some("03.02")));
    }
    #[test]
    fn stale_preview_and_duplicate_number_are_rejected_without_writes() {
        let (_tmp, mut e, p) = setup();
        let root = Path::new(&p.root);
        e.create_folder(&p.id, "", "A", "", &[]).unwrap();
        let v = e.create_folder(&p.id, "", "B", "", &[]).unwrap();
        let mut change = input(&v.entries[0].id);
        change.number = Some(2);
        assert!(e.preview_changes(&p.id, vec![change]).is_err());
        let preview = e
            .preview_changes(&p.id, vec![input(&v.entries[0].id)])
            .unwrap();
        fs::write(root.join("external.txt"), "keep").unwrap();
        assert_eq!(
            e.apply_changes(&p.id, &preview.id).unwrap_err().code,
            "STALE_PREVIEW"
        );
        assert!(root.join("01 A").exists());
    }
    #[test]
    fn interruption_rolls_back_deepest_first_after_database_reopen() {
        let (tmp, mut e, p) = setup();
        let root = Path::new(&p.root);
        fs::create_dir(root.join("Folder")).unwrap();
        fs::write(root.join("Folder/file.txt"), "content").unwrap();
        let v = e.view(&p.id).unwrap();
        let selected = v.entries.iter().find(|v| v.is_dir).unwrap();
        let preview = e.preview_changes(&p.id, vec![input(&selected.id)]).unwrap();
        let (plan, _, _, _) = e.load_change_plan(&p.id, &preview.id).unwrap();
        e.db.execute(
            "UPDATE change_plans SET status='running' WHERE id=?1",
            [&preview.id],
        )
        .unwrap();
        assert!(e
            .execute_change_steps(&p.id, &preview.id, &plan, 1)
            .is_err());
        drop(e);
        let mut e = Engine {
            db: crate::infrastructure::persistence::open_database(&tmp.path().join("app.db"))
                .unwrap(),
        };
        assert!(e.view(&p.id).unwrap().recovery_required);
        assert_eq!(
            e.create_folder(&p.id, "", "Blocked", "", &[])
                .unwrap_err()
                .code,
            "RECOVERY_REQUIRED"
        );
        e.recover_changes(&p.id).unwrap();
        assert_eq!(
            fs::read_to_string(root.join("Folder/file.txt")).unwrap(),
            "content"
        );
        assert!(!e.has_pending_changes(&p.id).unwrap());
    }
    #[test]
    fn uncertain_step_recovers_and_conflicting_original_is_never_overwritten() {
        let (_tmp, mut e, p) = setup();
        let root = Path::new(&p.root);
        fs::write(root.join("original.txt"), "valuable").unwrap();
        let v = e.view(&p.id).unwrap();
        let preview = e
            .preview_changes(&p.id, vec![input(&v.entries[0].id)])
            .unwrap();
        let (plan, _, _, _) = e.load_change_plan(&p.id, &preview.id).unwrap();
        let step = &plan.steps[0];
        e.db.execute(
            "UPDATE change_plans SET status='running',inflight=0 WHERE id=?1",
            [&preview.id],
        )
        .unwrap();
        rename_no_replace(&root.join(&step.before), &root.join(&step.after)).unwrap();
        fs::write(root.join(&step.before), "outside").unwrap();
        assert_eq!(
            e.recover_changes(&p.id).unwrap_err().code,
            "RECOVERY_CONFLICT"
        );
        assert_eq!(
            fs::read_to_string(root.join(&step.before)).unwrap(),
            "outside"
        );
        assert_eq!(
            fs::read_to_string(root.join(&step.after)).unwrap(),
            "valuable"
        );
        fs::rename(root.join(&step.before), root.join("keep-outside.txt")).unwrap();
        e.recover_changes(&p.id).unwrap();
        assert_eq!(
            fs::read_to_string(root.join("original.txt")).unwrap(),
            "valuable"
        );
    }
    #[test]
    fn windows_rename_never_replaces_destination() {
        let tmp = tempfile::tempdir().unwrap();
        let a = tmp.path().join("a");
        let b = tmp.path().join("b");
        fs::write(&a, "A").unwrap();
        fs::write(&b, "B").unwrap();
        assert!(rename_no_replace(&a, &b).is_err());
        assert_eq!(fs::read_to_string(a).unwrap(), "A");
        assert_eq!(fs::read_to_string(b).unwrap(), "B");
    }
    #[test]
    fn database_failure_after_rename_rolls_back_files_and_registry() {
        let (_tmp, mut e, p) = setup();
        let v = e.create_folder(&p.id, "", "Original", "", &[]).unwrap();
        let mut change = input(&v.entries[0].id);
        change.number = Some(3);
        let preview = e.preview_changes(&p.id, vec![change]).unwrap();
        e.db.execute_batch("CREATE TRIGGER fail_snapshot BEFORE UPDATE ON entries WHEN NEW.name='03 Original' BEGIN SELECT RAISE(ABORT,'injected database failure'); END;").unwrap();
        assert!(e.apply_changes(&p.id, &preview.id).is_err());
        assert!(Path::new(&p.root).join("01 Original").exists());
        assert!(!Path::new(&p.root).join("03 Original").exists());
        let view = e.view(&p.id).unwrap();
        assert_eq!(view.issue_count, 0);
        assert!(!view.recovery_required);
        assert_eq!(view.entries[0].id, v.entries[0].id);
    }
    #[test]
    fn extreme_external_code_returns_validation_error_without_panicking() {
        let (_tmp, mut e, p) = setup();
        fs::write(
            Path::new(&p.root).join("18446744073709551615 Huge.txt"),
            "keep",
        )
        .unwrap();
        let view = e.view(&p.id).unwrap();
        assert_eq!(
            e.preview_changes(&p.id, vec![input(&view.entries[0].id)])
                .unwrap_err()
                .code,
            "CODE_OVERFLOW"
        );
    }
    #[test]
    fn case_only_rename_uses_recoverable_staging() {
        let (_tmp, mut e, p) = setup();
        let v = e.create_folder(&p.id, "", "ABC", "", &[]).unwrap();
        let mut change = input(&v.entries[0].id);
        change.description = Some("abc".into());
        let preview = e.preview_changes(&p.id, vec![change]).unwrap();
        let after = e.apply_changes(&p.id, &preview.id).unwrap();
        assert_eq!(after.entries[0].name, "01 abc");
        assert_eq!(after.issue_count, 0);
    }
}
