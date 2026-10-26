mod changes;
use crate::{
    domain::naming::*,
    error::{AppError, AppResult},
    infrastructure::filesystem::*,
};
pub use changes::{ChangeInput, ChangePreview};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
    time::UNIX_EPOCH,
};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Label {
    pub id: String,
    pub name: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub root: String,
    pub widths: Vec<usize>,
    pub types: Vec<Label>,
    pub tags: Vec<Label>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub relative_path: String,
    pub parent: String,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
    pub code: Option<String>,
    pub hidden: bool,
    pub excluded: bool,
    pub exists: bool,
    pub issues: Vec<String>,
    pub kind: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProjectView {
    pub project: Project,
    pub entries: Vec<Entry>,
    pub issue_count: usize,
    pub recovery_required: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInput {
    pub name: String,
    pub root: String,
    pub widths: Vec<usize>,
    pub types: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    pub id: String,
    pub description: String,
    pub kind: String,
    pub tags: Vec<String>,
}

pub struct Engine {
    pub db: Connection,
}

fn decode<T: serde::de::DeserializeOwned>(value: String) -> AppResult<T> {
    serde_json::from_str(&value).map_err(|e| AppError::new("DATABASE_ERROR", e))
}
fn encode<T: Serialize>(value: &T) -> AppResult<String> {
    serde_json::to_string(value).map_err(|e| AppError::new("DATABASE_ERROR", e))
}
fn time_now() -> u64 {
    UNIX_EPOCH.elapsed().unwrap_or_default().as_secs()
}
fn parent_of(path: &str) -> String {
    Path::new(path)
        .parent()
        .unwrap_or(Path::new(""))
        .to_string_lossy()
        .into()
}

impl Engine {
    pub fn projects(&self) -> AppResult<Vec<Project>> {
        let mut stmt = self
            .db
            .prepare("SELECT id,name,root,widths,types,tags FROM projects ORDER BY rowid")?;
        let rows = stmt.query_map([], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, String>(5)?,
            ))
        })?;
        rows.map(|row| {
            let (id, name, root, widths, types, tags) = row?;
            Ok(Project {
                id,
                name,
                root,
                widths: decode(widths)?,
                types: decode(types)?,
                tags: decode(tags)?,
            })
        })
        .collect()
    }
    pub fn project(&self, id: &str) -> AppResult<Project> {
        self.projects()?
            .into_iter()
            .find(|p| p.id == id)
            .ok_or_else(|| AppError::new("PROJECT_NOT_FOUND", id))
    }
    pub fn add_project(&mut self, input: ProjectInput) -> AppResult<Project> {
        validate_widths(&input.widths)?;
        if input.name.trim().is_empty() || input.name.len() > 120 {
            return Err(AppError::new("INVALID_NAME", "Project name"));
        }
        let root = Path::new(&input.root).canonicalize()?;
        if !root.is_dir() || is_link(&fs::symlink_metadata(&root)?) {
            return Err(AppError::new("INVALID_ROOT", &input.root));
        }
        for existing in self.projects()? {
            let old = Path::new(&existing.root);
            if old == root || old.starts_with(&root) || root.starts_with(old) {
                return Err(AppError::new("OVERLAPPING_PROJECT", existing.name));
            }
        }
        let make_labels = |names: Vec<String>| -> Vec<Label> {
            let mut seen = HashSet::new();
            names
                .into_iter()
                .filter_map(|n| {
                    let n = n.trim();
                    if n.is_empty() || !seen.insert(n.to_lowercase()) {
                        None
                    } else {
                        Some(Label {
                            id: Uuid::new_v4().to_string(),
                            name: n.into(),
                        })
                    }
                })
                .collect()
        };
        let project = Project {
            id: Uuid::new_v4().to_string(),
            name: input.name.trim().into(),
            root: root.to_string_lossy().into(),
            widths: input.widths,
            types: make_labels(input.types),
            tags: make_labels(input.tags),
        };
        self.db.execute(
            "INSERT INTO projects(id,name,root,widths,types,tags) VALUES(?1,?2,?3,?4,?5,?6)",
            params![
                project.id,
                project.name,
                project.root,
                encode(&project.widths)?,
                encode(&project.types)?,
                encode(&project.tags)?
            ],
        )?;
        Ok(project)
    }
    pub fn view(&mut self, id: &str) -> AppResult<ProjectView> {
        let project = self.project(id)?;
        if self.has_pending_changes(id)? {
            return Ok(ProjectView {
                project,
                entries: vec![],
                issue_count: 0,
                recovery_required: true,
            });
        }
        let root = Path::new(&project.root);
        if !root.is_dir() {
            return Err(AppError::new("ROOT_UNAVAILABLE", &project.root));
        }
        if is_link(&fs::symlink_metadata(root)?) {
            return Err(AppError::new("LINK_NOT_SUPPORTED", &project.root));
        }
        let mut entries = Vec::new();
        let mut codes = HashMap::<String, Vec<usize>>::new();
        self.walk(&project, root, "", &[], &mut entries, &mut codes)?;
        for indexes in codes.values().filter(|v| v.len() > 1) {
            for index in indexes {
                entries[*index].issues.push("DUPLICATE_CODE".into());
            }
        }
        let seen: HashSet<_> = entries.iter().map(|e| e.id.clone()).collect();
        let mut stmt=self.db.prepare("SELECT id,relative_path,name,is_dir,kind,tags FROM entries WHERE project_id=?1 AND confirmed=1")?;
        let missing = stmt.query_map([id], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, bool>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, String>(5)?,
            ))
        })?;
        for row in missing {
            let (eid, rel, name, is_dir, kind, tags) = row?;
            if !seen.contains(&eid) {
                entries.push(Entry {
                    id: eid,
                    parent: parent_of(&rel),
                    relative_path: rel,
                    name,
                    is_dir,
                    size: 0,
                    modified: 0,
                    code: None,
                    hidden: false,
                    excluded: false,
                    exists: false,
                    issues: vec!["MISSING".into()],
                    kind,
                    tags: decode(tags)?,
                });
            }
        }
        let issue_count = entries.iter().filter(|e| !e.issues.is_empty()).count();
        Ok(ProjectView {
            project,
            entries,
            issue_count,
            recovery_required: false,
        })
    }
    fn walk(
        &mut self,
        project: &Project,
        folder: &Path,
        parent: &str,
        parent_code: &[u64],
        entries: &mut Vec<Entry>,
        codes: &mut HashMap<String, Vec<usize>>,
    ) -> AppResult<()> {
        let depth = Path::new(parent).components().count();
        if depth > 64 || entries.len() > 20000 {
            return Err(AppError::new(
                "SCAN_LIMIT",
                "This milestone supports up to 20,000 entries and 64 levels",
            ));
        }
        let mut children: Vec<_> = fs::read_dir(folder)?.collect::<Result<_, _>>()?;
        children.sort_by_key(|e| e.file_name());
        for child in children {
            if entries.len() >= 20000 {
                return Err(AppError::new("SCAN_LIMIT", "Maximum 20,000 entries"));
            }
            let metadata = fs::symlink_metadata(child.path())?;
            let name = child
                .file_name()
                .into_string()
                .map_err(|_| AppError::new("INVALID_NAME", "Non-Unicode path"))?;
            let rel = if parent.is_empty() {
                name.clone()
            } else {
                Path::new(parent).join(&name).to_string_lossy().into()
            };
            let excluded = is_excluded(&name) || is_link(&metadata);
            let modified = metadata
                .modified()?
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
                .min(i64::MAX as u128) as u64;
            let size = if metadata.is_dir() { 0 } else { metadata.len() };
            let mut issues = Vec::new();
            let parsed = code_parts(&name);
            let parts = parsed.as_ref().map(|p| p.0.clone()).unwrap_or_default();
            let rendered = if !parts.is_empty() {
                render_code(&parts, &project.widths).ok()
            } else {
                None
            };
            if !excluded {
                match &parsed {
                    None => issues.push("MISSING_CODE".into()),
                    Some((parts, _)) => {
                        if parts.len() != parent_code.len() + 1
                            || &parts[..parts.len() - 1] != parent_code
                            || (depth > 0 && parent_code.is_empty())
                        {
                            issues.push("WRONG_PARENT".into());
                        }
                        if rendered
                            .as_ref()
                            .is_none_or(|r| !name.starts_with(&format!("{r} ")))
                        {
                            issues.push("WRONG_WIDTH".into());
                        }
                        let (description, extension) = description_of(&name, metadata.is_dir());
                        if filename(
                            rendered.as_deref().unwrap_or(""),
                            &description,
                            extension.as_deref(),
                        )
                        .ok()
                        .as_ref()
                            != Some(&name)
                        {
                            issues.push("NAME_NOT_NORMALIZED".into());
                        }
                    }
                }
            }
            let old=self.db.query_row("SELECT id,size,modified,confirmed,kind,tags FROM entries WHERE project_id=?1 AND relative_path=?2",params![project.id,rel],|r|Ok((r.get::<_,String>(0)?,r.get::<_,u64>(1)?,r.get::<_,u64>(2)?,r.get::<_,bool>(3)?,r.get::<_,String>(4)?,r.get::<_,String>(5)?))).optional()?;
            let (eid, kind, tags) = match old {
                Some((eid, old_size, old_modified, confirmed, kind, tags)) => {
                    if !excluded {
                        if !confirmed {
                            issues.push("UNTRACKED".into());
                        } else if !metadata.is_dir()
                            && (old_size != size || old_modified != modified)
                        {
                            issues.push("CHANGED".into());
                        }
                    }
                    (eid, kind, decode(tags)?)
                }
                None if excluded => (format!("excluded:{rel}"), String::new(), Vec::new()),
                None => {
                    let eid = Uuid::new_v4().to_string();
                    self.db.execute("INSERT INTO entries(id,project_id,relative_path,name,is_dir,size,modified) VALUES(?1,?2,?3,?4,?5,?6,?7)",params![eid,project.id,rel,name,metadata.is_dir(),size,modified])?;
                    issues.push("UNTRACKED".into());
                    (eid, String::new(), Vec::new())
                }
            };
            let code = rendered;
            if !excluded && !parts.is_empty() {
                codes
                    .entry(code_key(&parts))
                    .or_default()
                    .push(entries.len());
            }
            entries.push(Entry {
                id: eid,
                relative_path: rel.clone(),
                parent: parent.into(),
                name,
                is_dir: metadata.is_dir(),
                size,
                modified,
                code,
                hidden: is_hidden(&child.path(), &metadata),
                excluded,
                exists: true,
                issues,
                kind,
                tags,
            });
            if metadata.is_dir() && !excluded {
                self.walk(project, &child.path(), &rel, &parts, entries, codes)?;
            }
        }
        Ok(())
    }
    pub fn next_code(
        &self,
        project: &Project,
        parent: &str,
        entries: &[Entry],
    ) -> AppResult<String> {
        let mut parts = if parent.is_empty() {
            Vec::new()
        } else {
            let node = entries
                .iter()
                .find(|e| e.relative_path == parent && e.is_dir && !e.excluded)
                .ok_or_else(|| AppError::new("INVALID_PARENT", parent))?;
            code_parts(&node.name)
                .ok_or_else(|| AppError::new("INVALID_PARENT", parent))?
                .0
        };
        let key = code_key(&parts);
        let high = self
            .db
            .query_row(
                "SELECT high_water FROM counters WHERE project_id=?1 AND parent_key=?2",
                params![project.id, key],
                |r| r.get::<_, u64>(0),
            )
            .optional()?
            .unwrap_or(0);
        let existing = entries
            .iter()
            .filter(|e| e.parent == parent && !e.excluded && e.exists)
            .filter_map(|e| code_parts(&e.name).and_then(|(p, _)| p.last().copied()))
            .max()
            .unwrap_or(0);
        parts.push(high.max(existing) + 1);
        render_code(&parts, &project.widths)
    }
    fn reserve(&self, project: &Project, code: &str) -> AppResult<()> {
        let parts = code_parts(&format!("{code} x"))
            .ok_or_else(|| AppError::new("INVALID_CODE", code))?
            .0;
        let parent = code_key(&parts[..parts.len() - 1]);
        let number = *parts.last().unwrap();
        self.db.execute("INSERT INTO counters(project_id,parent_key,high_water) VALUES(?1,?2,?3) ON CONFLICT(project_id,parent_key) DO UPDATE SET high_water=MAX(high_water,excluded.high_water)",params![project.id,parent,number])?;
        Ok(())
    }
    fn snapshot(
        &self,
        project_id: &str,
        entry_id: &str,
        relative: &str,
        kind: &str,
        tags: &[String],
    ) -> AppResult<()> {
        let project = self.project(project_id)?;
        let path = scoped_path(Path::new(&project.root), relative)?;
        let metadata = fs::symlink_metadata(&path)?;
        let name = path.file_name().unwrap().to_string_lossy().to_string();
        let (parts, _) = code_parts(&name).ok_or_else(|| AppError::new("MISSING_CODE", &name))?;
        let code = render_code(&parts, &project.widths)?;
        let modified = metadata
            .modified()?
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
            .min(i64::MAX as u128) as u64;
        self.db.execute("INSERT INTO entries(id,project_id,relative_path,name,is_dir,size,modified,code,code_key,confirmed,kind,tags) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,1,?10,?11) ON CONFLICT(id) DO UPDATE SET relative_path=excluded.relative_path,name=excluded.name,size=excluded.size,modified=excluded.modified,code=excluded.code,code_key=excluded.code_key,confirmed=1,kind=excluded.kind,tags=excluded.tags",params![entry_id,project_id,relative,name,metadata.is_dir(),if metadata.is_dir(){0}else{metadata.len()},modified,code,code_key(&parts),kind,encode(&tags)?])?;
        self.reserve(&project, &code)?;
        Ok(())
    }
    fn validate_metadata(project: &Project, kind: &str, tags: &[String]) -> AppResult<()> {
        if (!kind.is_empty() && !project.types.iter().any(|t| t.id == kind))
            || tags
                .iter()
                .any(|t| !project.tags.iter().any(|v| &v.id == t))
        {
            return Err(AppError::new(
                "INVALID_CLASSIFICATION",
                "Unknown project type/tag",
            ));
        }
        Ok(())
    }
    pub fn preview_folder(
        &mut self,
        id: &str,
        parent: &str,
        description: &str,
    ) -> AppResult<String> {
        let view = self.view(id)?;
        if view.recovery_required {
            return Err(AppError::new("RECOVERY_REQUIRED", id));
        }
        if view.issue_count > 0 {
            return Err(AppError::new("RECONCILIATION_REQUIRED", view.issue_count));
        }
        filename(
            &self.next_code(&view.project, parent, &view.entries)?,
            description,
            None,
        )
    }
    pub fn create_folder(
        &mut self,
        id: &str,
        parent: &str,
        description: &str,
        kind: &str,
        tags: &[String],
    ) -> AppResult<ProjectView> {
        let view = self.view(id)?;
        if view.recovery_required {
            return Err(AppError::new("RECOVERY_REQUIRED", id));
        }
        if view.issue_count > 0 {
            return Err(AppError::new("RECONCILIATION_REQUIRED", view.issue_count));
        }
        Self::validate_metadata(&view.project, kind, tags)?;
        let name = filename(
            &self.next_code(&view.project, parent, &view.entries)?,
            description,
            None,
        )?;
        let parent_path = scoped_path(Path::new(&view.project.root), parent)?;
        let target = parent_path.join(&name);
        let rel = if parent.is_empty() {
            name
        } else {
            Path::new(parent).join(name).to_string_lossy().into()
        };
        let op = Uuid::new_v4().to_string();
        self.db.execute(
            "INSERT INTO operations VALUES(?1,?2,'create','',?3,'planned',?4)",
            params![op, id, rel, time_now()],
        )?;
        fs::create_dir(&target)?;
        self.snapshot(id, &Uuid::new_v4().to_string(), &rel, kind, tags)?;
        self.db
            .execute("UPDATE operations SET status='completed' WHERE id=?1", [op])?;
        self.view(id)
    }
    pub fn confirm_entries(
        &mut self,
        id: &str,
        resolutions: Vec<Resolution>,
    ) -> AppResult<ProjectView> {
        if self.has_pending_changes(id)? {
            return Err(AppError::new("RECOVERY_REQUIRED", id));
        }
        // This milestone accepts unchanged valid names/metadata only. A rename migration
        // must be implemented as a dependency-aware plan before it is exposed in the UI.
        let view = self.view(id)?;
        let mut seen = HashSet::new();
        for resolution in &resolutions {
            if !seen.insert(&resolution.id) {
                return Err(AppError::new("INVALID_SELECTION", "Duplicate entry"));
            }
            Self::validate_metadata(&view.project, &resolution.kind, &resolution.tags)?;
            let entry = view
                .entries
                .iter()
                .find(|e| e.id == resolution.id)
                .ok_or_else(|| AppError::new("ENTRY_NOT_FOUND", &resolution.id))?;
            if !entry.exists
                || entry.excluded
                || entry
                    .issues
                    .iter()
                    .any(|e| e != "UNTRACKED" && e != "CHANGED")
            {
                return Err(AppError::new(
                    "REPAIR_NOT_IMPLEMENTED",
                    "This entry needs a rename/code repair, not just acknowledgement",
                ));
            }
        }
        for resolution in resolutions {
            let entry = view.entries.iter().find(|e| e.id == resolution.id).unwrap();
            self.snapshot(
                id,
                &entry.id,
                &entry.relative_path,
                &resolution.kind,
                &resolution.tags,
            )?;
        }
        self.view(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn setup() -> (tempfile::TempDir, Engine, Project) {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("workspace");
        fs::create_dir(&root).unwrap();
        let db =
            crate::infrastructure::persistence::open_database(&tmp.path().join("app.db")).unwrap();
        let mut engine = Engine { db };
        let project = engine
            .add_project(ProjectInput {
                name: "Test".into(),
                root: root.to_string_lossy().into(),
                widths: vec![2, 2, 3],
                types: vec![],
                tags: vec![],
            })
            .unwrap();
        (tmp, engine, project)
    }
    #[test]
    fn create_reopen_and_global_unique_codes() {
        let (tmp, mut engine, p) = setup();
        let view = engine.create_folder(&p.id, "", "Hóa đơn", "", &[]).unwrap();
        assert_eq!(view.issue_count, 0);
        assert_eq!(view.entries[0].name, "01 Hoa_don");
        let nested = engine
            .create_folder(&p.id, "01 Hoa_don", "Tháng 10", "", &[])
            .unwrap();
        assert!(nested.entries.iter().any(|e| e.name == "01.01 Thang_10"));
        let duplicate=engine.db.execute("INSERT INTO entries(id,project_id,relative_path,name,is_dir,size,modified,code_key) VALUES('fake',?1,'different','different',0,0,0,'1')",[&p.id]);
        assert!(duplicate.is_err());
        drop(engine);
        let db =
            crate::infrastructure::persistence::open_database(&tmp.path().join("app.db")).unwrap();
        let mut engine = Engine { db };
        assert_eq!(engine.projects().unwrap().len(), 1);
        assert_eq!(engine.view(&p.id).unwrap().issue_count, 0);
        let next = engine
            .create_folder(&p.id, "01 Hoa_don", "Đợt tiếp theo", "", &[])
            .unwrap();
        assert!(next.entries.iter().any(|e| e.name == "01.02 Dot_tiep_theo"));
    }
    #[test]
    fn external_changes_block_mutations_and_technical_files_are_excluded() {
        let (_tmp, mut engine, p) = setup();
        fs::write(Path::new(&p.root).join("desktop.ini"), "system").unwrap();
        assert_eq!(engine.view(&p.id).unwrap().issue_count, 0);
        fs::write(Path::new(&p.root).join("invoice.pdf"), "content").unwrap();
        assert_eq!(engine.view(&p.id).unwrap().issue_count, 1);
        assert!(engine.create_folder(&p.id, "", "New", "", &[]).is_err());
        assert!(!Path::new(&p.root).join("01 New").exists());
    }
    #[test]
    fn code_padding_duplicates_detected_before_acceptance() {
        let (_tmp, mut engine, p) = setup();
        fs::write(Path::new(&p.root).join("01 Invoice.pdf"), "a").unwrap();
        fs::write(Path::new(&p.root).join("001 Invoice.pdf"), "b").unwrap();
        let view = engine.view(&p.id).unwrap();
        assert!(view
            .entries
            .iter()
            .all(|e| e.issues.contains(&"DUPLICATE_CODE".into())));
        let r = Resolution {
            id: view.entries[0].id.clone(),
            description: String::new(),
            kind: String::new(),
            tags: vec![],
        };
        assert!(engine.confirm_entries(&p.id, vec![r]).is_err());
    }
}
