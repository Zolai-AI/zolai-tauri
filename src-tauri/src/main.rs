#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::params;
use serde::Serialize;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::Emitter;

#[derive(Serialize)]
struct SidecarResult {
  ok: bool,
  status: Option<i32>,
  stdout: String,
  stderr: String,
}

#[derive(Serialize)]
struct SqliteVecStatus {
  ok: bool,
  sqlite_path: String,
  extension_path: String,
  error: Option<String>,
}

fn run_sidecar(program: &str, args: &[&str]) -> Result<SidecarResult, String> {
  let output = Command::new(program)
    .args(args)
    .output()
    .map_err(|e| format!("failed to spawn `{program}`: {e}"))?;

  Ok(SidecarResult {
    ok: output.status.success(),
    status: output.status.code(),
    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
  })
}

fn default_sqlite_path() -> PathBuf {
  std::env::var("SQLITE_PATH")
    .map(PathBuf::from)
    .unwrap_or_else(|_| PathBuf::from("data/db/zolai.sqlite3"))
}

fn default_sqlite_vec_path() -> PathBuf {
  std::env::var("SQLITE_VEC_PATH")
    .map(PathBuf::from)
    .unwrap_or_else(|_| PathBuf::from("desktop/src-tauri/bin/sqlite-vec"))
}

#[tauri::command]
fn run_kg_build() -> Result<SidecarResult, String> {
  // Dev-mode implementation: run the repo script directly.
  run_sidecar("bash", &["scripts/kg/build_kg.sh"])
}

#[derive(Serialize)]
struct KgBuildStart {
  ok: bool,
}

// Streams logs to the frontend using Tauri events:
// - event: "kg_build:log" payload: string
// - event: "kg_build:done" payload: { ok: bool, status: number|null }
#[tauri::command]
fn run_kg_build_stream(app: tauri::AppHandle) -> Result<KgBuildStart, String> {
  std::thread::spawn(move || {
    let mut child = match Command::new("bash")
      .args(["scripts/kg/build_kg.sh"])
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn()
    {
      Ok(c) => c,
      Err(e) => {
        let _ = app.emit("kg_build:log", format!("Failed to start KG build: {e}"));
        let _ = app.emit(
          "kg_build:done",
          serde_json::json!({ "ok": false, "status": null }),
        );
        return;
      }
    };

    // stdout
    if let Some(out) = child.stdout.take() {
      let app2 = app.clone();
      std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(out);
        for line in reader.lines().flatten() {
          let _ = app2.emit("kg_build:log", line);
        }
      });
    }

    // stderr
    if let Some(err) = child.stderr.take() {
      let app2 = app.clone();
      std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(err);
        for line in reader.lines().flatten() {
          let _ = app2.emit("kg_build:log", line);
        }
      });
    }

    let status = child.wait().ok().and_then(|s| s.code());
    let ok = status.unwrap_or(1) == 0;
    let _ = app.emit("kg_build:done", serde_json::json!({ "ok": ok, "status": status }));
  });

  Ok(KgBuildStart { ok: true })
}

#[tauri::command]
fn sqlite_vec_status() -> SqliteVecStatus {
  let sqlite_path = default_sqlite_path();
  let ext_path = default_sqlite_vec_path();

  match rusqlite::Connection::open(&sqlite_path) {
    Ok(conn) => {
      // SAFETY: this is an explicit opt-in to SQLite extension loading for desktop only.
      if let Err(e) = unsafe { conn.load_extension(&ext_path, None) } {
        return SqliteVecStatus {
          ok: false,
          sqlite_path: sqlite_path.display().to_string(),
          extension_path: ext_path.display().to_string(),
          error: Some(format!("load_extension failed: {e}")),
        };
      }
      SqliteVecStatus {
        ok: true,
        sqlite_path: sqlite_path.display().to_string(),
        extension_path: ext_path.display().to_string(),
        error: None,
      }
    }
    Err(e) => SqliteVecStatus {
      ok: false,
      sqlite_path: sqlite_path.display().to_string(),
      extension_path: ext_path.display().to_string(),
      error: Some(format!("open failed: {e}")),
    },
  }
}

#[tauri::command]
fn kg_query(query: String) -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["kg_query", "--query", &query])
}

#[tauri::command]
fn rag_search(query: String) -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["rag_search", "--query", &query])
}

#[tauri::command]
fn run_crawler() -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["run_crawler"])
}

#[tauri::command]
fn run_validator() -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["run_validator"])
}

#[tauri::command]
fn pull_hf_dataset(repo_id: String) -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["pull_hf_dataset", "--repo", &repo_id])
}

#[tauri::command]
fn start_training_job(job_spec_json: String) -> Result<SidecarResult, String> {
  run_sidecar("zolai-cli", &["start_training_job", "--spec", &job_spec_json])
}

#[tauri::command]
fn next_server_status() -> Result<SidecarResult, String> {
  run_sidecar("next-server", &["--version"])
}

#[tauri::command]
fn ollama_status() -> Result<SidecarResult, String> {
  run_sidecar("ollama", &["--version"])
}

// ---------------------------------------------------------------------------
// Database commands
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct DbInitResult {
  ok: bool,
  db_path: String,
  tables_created: usize,
  error: Option<String>,
}

#[tauri::command]
fn db_init() -> Result<DbInitResult, String> {
  let db_path = default_sqlite_path();

  // Ensure parent directory exists
  if let Some(parent) = db_path.parent() {
    std::fs::create_dir_all(parent)
      .map_err(|e| format!("Failed to create db directory: {e}"))?;
  }

  let conn = rusqlite::Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database: {e}"))?;

  // Enable WAL mode
  conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
    .map_err(|e| format!("Failed to set pragmas: {e}"))?;

  // Create all 8 tables
  let schema = include_str!("../db/schema.sql");
  conn.execute_batch(schema)
    .map_err(|e| format!("Failed to create schema: {e}"))?;

  // Count tables created
  let table_count: usize = conn
    .prepare("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .map_err(|e| format!("Failed to count tables: {e}"))?
    .query_row([], |row| row.get(0))
    .map_err(|e| format!("Failed to query table count: {e}"))?;

  Ok(DbInitResult {
    ok: true,
    db_path: db_path.display().to_string(),
    tables_created: table_count,
    error: None,
  })
}

#[derive(Serialize)]
struct DictEntry {
  zolai: String,
  english: String,
  english_clean: Option<String>,
  source: String,
  pos: String,
}

#[tauri::command]
fn db_lookup_word(word: String) -> Result<Vec<DictEntry>, String> {
  let db_path = default_sqlite_path();
  let conn = rusqlite::Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database: {e}"))?;

  let pattern = format!("%{word}%");
  let mut stmt = conn
    .prepare(
      "SELECT zolai, english, english_clean, source, pos
       FROM dictionary
       WHERE zolai LIKE ?1 OR english LIKE ?1
       LIMIT 50",
    )
    .map_err(|e| format!("Failed to prepare query: {e}"))?;

  let entries = stmt
    .query_map(params![pattern], |row| {
      Ok(DictEntry {
        zolai: row.get(0)?,
        english: row.get(1)?,
        english_clean: row.get(2)?,
        source: row.get(3)?,
        pos: row.get(4)?,
      })
    })
    .map_err(|e| format!("Query failed: {e}"))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Failed to collect results: {e}"))?;

  Ok(entries)
}

#[derive(Serialize)]
struct BibleVerse {
  ref_id: String,
  book: String,
  chapter: i32,
  verse: i32,
  zo_tdb77: String,
  zo_tedim2010: String,
  en_kjv: String,
}

#[tauri::command]
fn db_search_bible(query: String) -> Result<Vec<BibleVerse>, String> {
  let db_path = default_sqlite_path();
  let conn = rusqlite::Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database: {e}"))?;

  let pattern = format!("%{query}%");
  let mut stmt = conn
    .prepare(
      "SELECT ref, book, chapter, verse, zo_tdb77, zo_tedim2010, en_kJV
       FROM bible_verses
       WHERE zo_tdb77 LIKE ?1 OR zo_tedim2010 LIKE ?1 OR en_kJV LIKE ?1
       LIMIT 100",
    )
    .map_err(|e| format!("Failed to prepare query: {e}"))?;

  let verses = stmt
    .query_map(params![pattern], |row| {
      Ok(BibleVerse {
        ref_id: row.get(0)?,
        book: row.get(1)?,
        chapter: row.get(2)?,
        verse: row.get(3)?,
        zo_tdb77: row.get(4)?,
        zo_tedim2010: row.get(5)?,
        en_kjv: row.get(6)?,
      })
    })
    .map_err(|e| format!("Query failed: {e}"))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Failed to collect results: {e}"))?;

  Ok(verses)
}

#[derive(Serialize)]
struct CountResult {
  table: String,
  count: i64,
}

#[tauri::command]
fn db_count(table: String) -> Result<CountResult, String> {
  let db_path = default_sqlite_path();
  let conn = rusqlite::Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database: {e}"))?;

  // Validate table name to prevent SQL injection
  let valid_tables = [
    "dictionary", "bible_verses", "grammar_patterns", "phrases",
    "vocab", "translations", "word_usage", "provenance",
  ];
  if !valid_tables.contains(&table.as_str()) {
    return Err(format!("Invalid table name: {table}"));
  }

  let sql = format!("SELECT COUNT(*) FROM {table}");
  let count: i64 = conn
    .query_row(&sql, [], |row| row.get(0))
    .map_err(|e| format!("Query failed: {e}"))?;

  Ok(CountResult { table, count })
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      run_kg_build,
      run_kg_build_stream,
      sqlite_vec_status,
      kg_query,
      rag_search,
      run_crawler,
      run_validator,
      pull_hf_dataset,
      start_training_job,
      next_server_status,
      ollama_status,
      db_init,
      db_lookup_word,
      db_search_bible,
      db_count,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json;

  #[test]
  fn sidecar_result_serde_roundtrip() {
    let s = SidecarResult {
      ok: true,
      status: Some(0),
      stdout: "hello\n".into(),
      stderr: String::new(),
    };
    let json = serde_json::to_string(&s).expect("serialize");
    let parsed: SidecarResult = serde_json::from_str(&json).expect("deserialize");
    assert!(parsed.ok);
    assert_eq!(parsed.status, Some(0));
    assert_eq!(parsed.stdout, "hello\n");
    assert!(parsed.stderr.is_empty());
  }

  #[test]
  fn sidecar_result_serde_failure() {
    let s = SidecarResult {
      ok: false,
      status: Some(1),
      stdout: String::new(),
      stderr: "error msg".into(),
    };
    let json = serde_json::to_string(&s).expect("serialize");
    let v: serde_json::Value = serde_json::from_str(&json).expect("to value");
    assert_eq!(v["ok"], false);
    assert_eq!(v["status"], 1);
    assert_eq!(v["stderr"], "error msg");
  }

  #[test]
  fn default_sqlite_path_fallback() {
    // When SQLITE_PATH is not set, returns the hardcoded default.
    // We temporarily remove the env var if present.
    let saved = std::env::var("SQLITE_PATH").ok();
    std::env::remove_var("SQLITE_PATH");
    let p = default_sqlite_path();
    assert_eq!(p, PathBuf::from("data/db/zolai.sqlite3"));
    // Restore.
    if let Some(v) = saved {
      std::env::set_var("SQLITE_PATH", v);
    }
  }

  #[test]
  fn default_sqlite_vec_path_fallback() {
    let saved = std::env::var("SQLITE_VEC_PATH").ok();
    std::env::remove_var("SQLITE_VEC_PATH");
    let p = default_sqlite_vec_path();
    assert_eq!(
      p,
      PathBuf::from("desktop/src-tauri/bin/sqlite-vec")
    );
    if let Some(v) = saved {
      std::env::set_var("SQLITE_VEC_PATH", v);
    }
  }

  #[test]
  fn sqlite_vec_status_struct_serde() {
    let s = SqliteVecStatus {
      ok: true,
      sqlite_path: "/tmp/test.db".into(),
      extension_path: "/tmp/vec.so".into(),
      error: None,
    };
    let json = serde_json::to_string(&s).expect("serialize");
    assert!(json.contains("\"ok\":true"));
    assert!(json.contains("test.db"));
  }
}

