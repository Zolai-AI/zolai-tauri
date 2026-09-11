#!/usr/bin/env python3
"""Migration script for Zolai Tauri desktop SQLite database.

Creates the SQLite database at data/db/zolai.sqlite3 and loads data
from JSONL files. Uses same logic as zolai-core migrate.py.

Usage:
    python db/migrate.py [--data-dir PATH] [--db-path PATH]
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path


DEFAULT_DB_PATH = "data/db/zolai.sqlite3"
DEFAULT_DATA_DIR = "../../data"


def create_schema(conn: sqlite3.Connection, schema_path: Path) -> None:
    """Execute schema.sql to create all tables."""
    if not schema_path.exists():
        print(f"Error: Schema file not found: {schema_path}")
        sys.exit(1)
    schema_sql = schema_path.read_text()
    conn.executescript(schema_sql)
    print(f"Schema created from {schema_path}")


def load_jsonl(conn: sqlite3.Connection, filepath: Path, table: str) -> int:
    """Load a JSONL file into a table. Returns row count."""
    if not filepath.exists():
        print(f"  Skipping {table}: {filepath} not found")
        return 0

    rows = []
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))

    if not rows:
        print(f"  {table}: 0 rows (empty file)")
        return 0

    # Get column names from first row
    cols = list(rows[0].keys())
    placeholders = ", ".join(["?"] * len(cols))
    col_names = ", ".join(cols)

    # Serialize JSON columns
    json_cols = {
        "english", "examples", "books", "meaning_shifts",
        "co_occurring_words",
    }
    cleaned = []
    for row in rows:
        clean_row = []
        for col in cols:
            val = row.get(col)
            if col in json_cols and isinstance(val, (list, dict)):
                clean_row.append(json.dumps(val, ensure_ascii=False))
            else:
                clean_row.append(val)
        cleaned.append(clean_row)

    # Insert
    conn.executemany(
        f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})",
        cleaned,
    )
    conn.commit()
    print(f"  {table}: {len(cleaned)} rows loaded")
    return len(cleaned)


def migrate(data_dir: Path, db_path: Path) -> dict[str, int]:
    """Run full migration."""
    schema_path = Path(__file__).parent / "schema.sql"

    # Ensure parent directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # Connect and create schema
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    create_schema(conn, schema_path)

    # Map table names to JSONL file paths
    table_files = {
        "dictionary": data_dir / "dictionary/processed/dict_zo_en_master_v1.jsonl",
        "bible_verses": data_dir / "bible/parallel_corpus_v1.jsonl",
        "grammar_patterns": data_dir / "bible/grammar_patterns_v2.jsonl",
        "phrases": data_dir / "bible/phrases_v1.jsonl",
        "vocab": data_dir / "bible/vocab_index_full.jsonl",
        "translations": data_dir / "bible/translation_pairs_v1.jsonl",
        "word_usage": data_dir / "bible/context/word_usage_profiles.jsonl",
    }

    results = {}
    for table, filepath in table_files.items():
        count = load_jsonl(conn, filepath, table)
        results[table] = count

    conn.close()
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Zolai Tauri DB migration")
    parser.add_argument(
        "--data-dir",
        default=DEFAULT_DATA_DIR,
        help="Path to data directory (default: ../../data)",
    )
    parser.add_argument(
        "--db-path",
        default=DEFAULT_DB_PATH,
        help="Path to SQLite database (default: data/db/zolai.sqlite3)",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    db_path = Path(args.db_path).resolve()

    print(f"Data directory: {data_dir}")
    print(f"Database path: {db_path}")
    print()

    if not data_dir.exists():
        print(f"Error: Data directory not found: {data_dir}")
        sys.exit(1)

    results = migrate(data_dir, db_path)

    total = sum(results.values())
    print(f"\nMigration complete: {total} total rows")
    for table, count in results.items():
        print(f"  {table}: {count:,}")

    # Show DB size
    if db_path.exists():
        size = db_path.stat().st_size
        for unit in ("B", "KB", "MB", "GB"):
            if size < 1024:
                print(f"\nDatabase size: {size:.1f} {unit}")
                break
            size /= 1024


if __name__ == "__main__":
    main()
