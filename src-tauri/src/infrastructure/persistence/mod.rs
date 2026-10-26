use crate::error::{AppError, AppResult};
use rusqlite::Connection;
use std::path::Path;

pub fn open_database(path: &Path) -> AppResult<Connection> {
    let db = Connection::open(path)?;
    db.busy_timeout(std::time::Duration::from_secs(5))?;
    db.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;")?;
    let version: i64 = db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if version > 2 {
        return Err(AppError::new(
            "DATABASE_TOO_NEW",
            "A newer HFolder version created this database",
        ));
    }
    if version < 1 {
        db.execute_batch(include_str!("../../../migrations/001_initial.sql"))?;
    }
    if version < 2 {
        db.execute_batch(include_str!("../../../migrations/002_changes.sql"))?;
    }

    Ok(db)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn version_one_upgrades_and_newer_database_is_rejected() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("app.db");
        let db = Connection::open(&path).unwrap();
        db.execute_batch(include_str!("../../../migrations/001_initial.sql"))
            .unwrap();
        drop(db);
        let db = open_database(&path).unwrap();
        assert_eq!(
            db.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        assert_eq!(
            db.query_row("PRAGMA foreign_keys", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        db.execute_batch("PRAGMA user_version=999").unwrap();
        drop(db);
        assert!(open_database(&path).is_err());
    }
}
