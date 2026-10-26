use crate::error::{AppError, AppResult};
use std::{
    fs,
    path::{Component, Path, PathBuf},
};

pub fn is_link(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        metadata.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

pub fn is_hidden(path: &Path, metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        let _ = path;
        metadata.file_attributes() & 0x2 != 0
    }
    #[cfg(not(windows))]
    {
        let _ = metadata;
        path.file_name()
            .is_some_and(|n| n.to_string_lossy().starts_with('.'))
    }
}

pub fn is_excluded(name: &str) -> bool {
    matches!(
        name.to_lowercase().as_str(),
        ".git" | "desktop.ini" | "thumbs.db" | "$recycle.bin" | "system volume information"
    )
}

pub fn scoped_path(root: &Path, relative: &str) -> AppResult<PathBuf> {
    let rel = Path::new(relative);
    if rel.components().any(|p| !matches!(p, Component::Normal(_))) && !relative.is_empty() {
        return Err(AppError::new("PATH_OUTSIDE_PROJECT", relative));
    }
    if is_link(&fs::symlink_metadata(root)?) {
        return Err(AppError::new("LINK_NOT_SUPPORTED", root.to_string_lossy()));
    }
    let canonical_root = root.canonicalize()?;
    let mut path = canonical_root.clone();
    for part in rel.components() {
        path.push(part);
        let metadata = fs::symlink_metadata(&path)?;
        if is_link(&metadata) {
            return Err(AppError::new("LINK_NOT_SUPPORTED", relative));
        }
    }
    let canonical = path.canonicalize()?;
    if !canonical.starts_with(&canonical_root) {
        return Err(AppError::new("PATH_OUTSIDE_PROJECT", relative));
    }
    Ok(canonical)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn guard_rejects_parent_and_absolute_paths() {
        let root = tempfile::tempdir().unwrap();
        assert!(scoped_path(root.path(), "../outside").is_err());
        assert!(scoped_path(root.path(), "/outside").is_err());
        assert!(scoped_path(root.path(), "").is_ok());
        assert!(is_excluded("DESKTOP.INI"));
        assert!(!is_excluded(".env"));
    }
}
