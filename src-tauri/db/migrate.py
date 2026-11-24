#!/usr/bin/env python3
"""Migration script for the Zolai Tauri desktop database.

Loads JSONL data into a database created from `db/schema.sql`. The engine is
chosen by URL, not by code: SQLite (embedded, default) or PostgreSQL (server
mode, opt-in). See `db/drivers.py`.

Usage:
    python db/migrate.py [--data-dir PATH] [--db-path PATH] [--db-url URL]

`--db-url` (or ZOLAI_DB_URL) wins over `--db-path`. Examples:
    sqlite:///data/db/zolai.sqlite3                (default)
    postgresql://user:pass@host:5432/zolai_tauri   (server mode)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from drivers import connect, executescript, load_rows, make_driver  # noqa: E402

DEFAULT_DB_PATH = "data/db/zolai.sqlite3"
DEFAULT_DATA_DIR = "../../data"


def create_schema(driver, conn, schema_path: Path) -> None:
    """Execute schema.sql to create all tables (portable across engines)."""
    if not schema_path.exists():
        print(f"Error: Schema file not found: {schema_path}")
        sys.exit(1)
    schema_sql = schema_path.read_text()
    executescript(driver, conn, schema_sql)
    print(f"Schema created from {schema_path}")


def load_jsonl(driver, conn, filepath: Path, table: str) -> int:
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
    count = load_rows(driver, conn, table, cols, cleaned)
    print(f"  {table}: {count} rows loaded")
    return count


def migrate(data_dir: Path, db_url: str) -> dict[str, int]:
    """Run full migration against the engine chosen by db_url."""
    schema_path = Path(__file__).parent / "schema.sql"

    driver = make_driver(db_url)
    conn = connect(db_url)
    print(f"Engine: {driver.dialect}")

    create_schema(driver, conn, schema_path)

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
        count = load_jsonl(driver, conn, filepath, table)
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
    parser.add_argument(
        "--db-url",
        default=None,
        help="Full DB URL (sqlite:///… or postgresql://…). Overrides --db-path "
        "and ZOLAI_DB_URL.",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    if args.db_url:
        db_url = args.db_url
    elif os.getenv("ZOLAI_DB_URL", "").strip():
        db_url = os.environ["ZOLAI_DB_URL"].strip()
    else:
        db_url = f"sqlite:///{Path(args.db_path).resolve()}"

    print(f"Data directory: {data_dir}")
    print(f"Database URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    print()

    if not data_dir.exists():
        print(f"Error: Data directory not found: {data_dir}")
        sys.exit(1)

    results = migrate(data_dir, db_url)

    total = sum(results.values())
    print(f"\nMigration complete: {total} total rows")
    for table, count in results.items():
        print(f"  {table}: {count:,}")

    # Show DB size (embedded sqlite only)
    if db_url.startswith("sqlite:///"):
        db_path = Path(db_url[len("sqlite:///"):])
        if db_path.exists():
            size = db_path.stat().st_size
            for unit in ("B", "KB", "MB", "GB"):
                if size < 1024:
                    print(f"\nDatabase size: {size:.1f} {unit}")
                    break
                size /= 1024


if __name__ == "__main__":
    main()
