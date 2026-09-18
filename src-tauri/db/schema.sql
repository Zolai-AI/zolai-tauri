-- Zolai SQLite schema for Tauri desktop app
-- Matches zolai-core ORM models (8 tables)

-- Enable WAL mode for better concurrent performance
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- 1. Dictionary (Zolai→English)
CREATE TABLE IF NOT EXISTS dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zolai TEXT NOT NULL,
    english TEXT NOT NULL,
    english_clean TEXT,
    source TEXT NOT NULL DEFAULT '',
    pos TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dict_zolai ON dictionary(zolai);
CREATE INDEX IF NOT EXISTS idx_dict_zolai_source ON dictionary(zolai, source);

-- 2. Bible verses (parallel EN↔ZO)
CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    zo_tdb77 TEXT NOT NULL DEFAULT '',
    zo_tedim2010 TEXT NOT NULL DEFAULT '',
    en_kJV TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bible_ref ON bible_verses(ref);
CREATE INDEX IF NOT EXISTS idx_bible_book ON bible_verses(book);

-- 3. Grammar patterns
CREATE TABLE IF NOT EXISTS grammar_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_id TEXT NOT NULL,
    pattern TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    function TEXT NOT NULL DEFAULT '',
    examples TEXT NOT NULL DEFAULT '[]',
    frequency INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grammar_pattern ON grammar_patterns(pattern);

-- 4. Phrases (multi-word expressions)
CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zo TEXT NOT NULL,
    english TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    examples TEXT NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phrases_zo ON phrases(zo);

-- 5. Vocabulary (word frequency + book occurrences)
CREATE TABLE IF NOT EXISTS vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headword TEXT NOT NULL,
    english TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    books TEXT NOT NULL DEFAULT '[]',
    examples TEXT NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocab_headword ON vocab(headword);

-- 6. Translation pairs (EN↔ZO sentence pairs)
CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'zo_to_en',
    reference TEXT NOT NULL DEFAULT '',
    confidence REAL NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trans_source ON translations(source);
CREATE INDEX IF NOT EXISTS idx_trans_target ON translations(target);

-- 7. Word usage profiles (per-book meaning shifts)
CREATE TABLE IF NOT EXISTS word_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    book TEXT NOT NULL,
    total_freq INTEGER NOT NULL DEFAULT 0,
    meaning_shifts TEXT NOT NULL DEFAULT '[]',
    co_occurring_words TEXT NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_word ON word_usage(word);
CREATE INDEX IF NOT EXISTS idx_usage_word_book ON word_usage(word, book);

-- 8. Provenance (data file tracking)
CREATE TABLE IF NOT EXISTS provenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    sha256 TEXT NOT NULL DEFAULT '',
    row_count INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT '',
    generator_script TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prov_filename ON provenance(filename);
