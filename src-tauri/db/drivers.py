"""Dual-engine database drivers for zolai-tauri: SQLite today, PostgreSQL opt-in.

Mirrors `zolai-tts/src/zolai_tts/db/drivers.py`. The desktop app ships SQLite
as its embedded offline store (`rusqlite`, bundled); this module exists for the
server-mode migration path so the same schema can be materialised in
PostgreSQL without editing the migration script:

    sqlite:///data/db/zolai.sqlite3                (default, embedded)
    postgresql://user:pass@host:5432/zolai_tauri   (server mode, opt-in)

Select the engine with `ZOLAI_DB_URL` (or `--db-url`); the URL scheme decides
the driver. Call sites never change when switching engines.

Portability rules the migration code follows so both engines behave alike:
  * placeholders are written `?` and translated to `%s` for PostgreSQL;
  * booleans are stored as INTEGER 0/1;
  * timestamps are ISO-8601 UTC strings (`YYYY-MM-DDTHH:MM:SSZ`, TEXT);
  * JSON is stored as TEXT (both engines accept it, no jsonb dependency);
  * no engine-specific SQL functions (no strftime/datetime());
  * `schema.sql` is written in the shared subset; the SQLite-only
    `AUTOINCREMENT` keyword is rewritten to the PostgreSQL identity form.
"""

from __future__ import annotations

import os
import re
import sqlite3
from pathlib import Path
from typing import Any, Iterable


class DriverError(RuntimeError):
    """Raised when a driver cannot be created or used."""


DEFAULT_SQLITE_PATH = "data/db/zolai.sqlite3"
ENV_URL = "ZOLAI_DB_URL"


def resolve_url(url: str | None = None) -> str:
    """Resolution order: explicit arg -> ZOLAI_DB_URL -> embedded sqlite default."""
    if url:
        return url
    env = os.getenv(ENV_URL, "").strip()
    if env:
        return env
    return f"sqlite:///{DEFAULT_SQLITE_PATH}"


class SqliteDriver:
    """sqlite3-backed driver. WAL + foreign keys are enabled on connect."""

    dialect = "sqlite"

    def __init__(self, path: str):
        self.path = path

    def translate(self, sql: str) -> str:
        return sql

    def connect(self) -> sqlite3.Connection:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn


class PostgresDriver:
    """PostgreSQL driver via psycopg (v3) or psycopg2, both optional."""

    dialect = "postgres"

    def __init__(self, url: str):
        self.url = url
        self._module = self._load_module()

    @staticmethod
    def _load_module():
        try:
            import psycopg  # psycopg v3

            return psycopg
        except ImportError:
            try:
                import psycopg2 as psycopg  # type: ignore[no-redef]

                return psycopg
            except ImportError as exc:  # pragma: no cover - depends on env
                raise DriverError(
                    "PostgreSQL URL given but neither psycopg[binary] nor "
                    "psycopg2 is installed. Run: pip install 'psycopg[binary]'"
                ) from exc

    def translate(self, sql: str) -> str:
        out = sql.replace("?", "%s")
        out = re.sub(r"\bINTEGER PRIMARY KEY AUTOINCREMENT\b",
                     "INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY", out)
        out = out.replace("PRAGMA journal_mode=WAL", "SELECT 1")
        out = out.replace("PRAGMA foreign_keys=ON", "SELECT 1")
        return out

    def connect(self):
        return self._module.connect(self.url)


def make_driver(url: str | None = None):
    """Pick a driver from the URL scheme."""
    resolved = resolve_url(url)
    if resolved.startswith("postgres://") or resolved.startswith("postgresql://"):
        return PostgresDriver(resolved)
    if resolved.startswith("sqlite:///"):
        return SqliteDriver(resolved[len("sqlite:///"):])
    if not resolved.startswith("sqlite:"):
        # Bare path is still treated as sqlite for convenience.
        return SqliteDriver(resolved)
    raise DriverError(f"Unsupported database URL scheme: {resolved!r}")


def connect(url: str | None = None):
    """Open a connection for the resolved URL (sqlite by default)."""
    return make_driver(url).connect()


def executescript(driver, conn, sql: str) -> None:
    """Run a multi-statement schema script on either engine."""
    if driver.dialect == "sqlite":
        conn.executescript(driver.translate(sql))
        return
    cur = conn.cursor()
    for statement in (s.strip() for s in sql.split(";")):
        if statement:
            cur.execute(driver.translate(statement))
    conn.commit()


def load_rows(driver, conn, table: str, columns: list[str],
              rows: Iterable[list[Any]]) -> int:
    """Bulk-insert rows using the shared `?` placeholder convention."""
    cols = ", ".join(columns)
    placeholders = ", ".join("?" for _ in columns)
    sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"
    payload = list(rows)
    if not payload:
        return 0
    cur = conn.cursor()
    if driver.dialect == "postgres":
        cur.executemany(driver.translate(sql), payload)
    else:
        conn.executemany(driver.translate(sql), payload)
    conn.commit()
    return len(payload)
