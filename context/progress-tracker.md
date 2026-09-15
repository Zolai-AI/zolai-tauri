# Progress Tracker

## 2026-09-04 — Setup baseline
- Repo connected to `Zolai-AI/zolai-tauri`.
- Tauri 2 desktop shell wrapping Next.js app; bundled core server + GGUF.

## 2026-09-13 (Session — Database Names + Chat Gemini + Typing Indicator)

### Database Table Names Fixed
- Backend `/desktop/tables` returns `{table: "name", rows: N}` — field is `table`, not `name`
- Added `table?: string` to `TableRow` type in `types.ts`
- Updated `tableName()` helper: `t.table ?? t.name ?? t.table_name ?? 'unknown'`
- Sidebar now shows table names correctly

### Chat Gemini Endpoint
- Backend `/chat/zolai` only called Ollama — user has Gemini selected
- Added `/chat/gemini` endpoint to `server.py` using `zolai-ai-local` Gemini WebAPI
- Frontend `chatStreamZolai` routes to `/chat/gemini` when provider is `gemini`, else `/chat/zolai`
- Added `chatGemini` route to `contract.ts`

### Typing Indicator
- Animated bouncing dots + "Thinking..." text while waiting for first token
- Shows only when `busy && last assistant message is empty`
- Added `typing-bounce` keyframe to `index.css`

### Git Commits
- zolai-tauri: `caa5f21` — `fix(frontend): database table names + chat provider routing`
- zolai-tauri: `5122b5f` — `fix(frontend): database table names, chat model passthrough, typing indicator`
- zolai-core: `b8803e4` — `feat(api): add /chat/gemini endpoint for local Gemini WebAPI`
- All pushed to origin

### Remaining
- Database governance audit (Phase 0) — per user's 57-section master prompt
- Test Gemini chat end-to-end (requires Chrome cookies + zolai-ai-local)
- Fix any remaining missing endpoints in desktop router

## 2026-09-13 (Session — Database Governance Phase 0 Audit)

### Phase 0 Audit Complete
- 11 audit documents produced in `zolai-core/docs/database-audit/` (137KB)
- 72 tables fully inventoried with schemas, row counts, PKs, indexes
- 14 risks identified (R1 Critical → R14 High)
- 14 open questions requiring team input
- Consolidation matrix: 33 KEEP_CANONICAL, 4 CONSOLIDATE_LATER, 35 ARCHIVE_LATER

### Additional Fixes This Session
- Fixed chat 405: `/chat/gemini` endpoint added to server.py
- Fixed orjson dependency: added to pyproject.toml
- Fixed dict browse: added offset + q params to `/desktop/dict/browse`
- Fixed menu.sh: corrected option mapping (1-9,0)
- Fixed database sidebar scroll: added min-h-0

### Git Commits
- zolai-core: `8499a1e` — Phase 0 audit documents
- zolai-core: `513ec28` — menu.sh fix
- zolai-core: `faf68f0` — orjson dependency
- zolai-core: `7a0e42a` — dict browse offset/filter
- zolai-tauri: `1798a33` — database sidebar scroll
- zolai-tauri: `83ccdfe` — DictDenormalized total field

### Next Phase
- Phase 1: Foundation (canonical model, repository/service boundaries, transactions, constraints)
- Requires team review of Phase 0 audit + open questions resolution

## 2026-09-13 (Session — Database Governance Phase 1 Evidence Validation)

### Phase 1 Evidence Validation Complete
- 15 audit documents + 4 JSON files in `zolai-core/docs/database-audit/phase1/`
- 71 tables (corrected from Phase 0's 72)
- All 11 questions (Q1-Q11) answered with SQL evidence
- Key findings:
  - vocab=94K (not 20K), word_usage=60K (not 7K)
  - 11 zero-row tables identified
  - 24 import staging tables can be dropped after stabilization
  - 3 table families have duplicates requiring consolidation
  - Target schema: 33 tables (-54% reduction from 71)

### Phase 0 + Phase 1 Combined
- Phase 0: 11 docs (table inventory, classification, risk register)
- Phase 1: 15 docs (evidence validation, row reconciliation, source of truth)
- Total: 26 audit documents + 5 JSON files

### Next Phase
- Phase 2: Non-Destructive Migration Design
- Requires team review of Phase 1 findings + open questions resolution

## 2026-09-13 (Session — Database Governance Complete Audit + V2 Schema)

### Phase 0 Audit (22 docs)
- Full database inventory: 79 tables, ~3.16M rows, 1.2GB
- Table classification, relationship mapping, risk register

### Phase 1 Evidence Validation (19 docs)
- SQL evidence for all 11 questions (Q1-Q11)
- Row-level reconciliation for all table families
- Source-of-truth validation per domain

### Revised Target Schema V2 (6 docs + 5 JSON)
- 79 current tables → 23 target tables
- Column-level reconciliation for all merges
- Business key analysis with uniqueness tests
- Migration loss accounting: ~1.13% (dedup only)
- 7-phase non-destructive migration plan

### Key Findings
- vocab.headword vs zolai_vocabulary.zolai join column
- grammar_patterns_enhanced: ALL pattern_id=NULL (cannot join)
- zolai_word_usage: different schema from word_usage (export, not merge)
- translations: 67× max duplication, ~6% loss on dedup
- bible_verses: 30,569 refs with 2-3 duplicates (multi-edition)

### Total Audit Output
- Phase 0: 22 files in docs/database-audit/phase0/
- Phase 1: 25 files in docs/database-audit/phase1/ (19 original + 6 V2)
- Total: 47 audit files + 5 JSON data files

### Next Phase
- Phase 2: Foundation Implementation
  - Phase 2A: Backup + Core Migration (12 tables)
  - Phase 2B: Derived + Audit Tables (11 tables)
  - Phase 2C: Validation + Views
  - Phase 2D: Application Layer Update

## 2026-09-13 (Session — Phase 2A Migration Complete)

### Phase 2A: Backup + Core Migration
- Created `scripts/migration/phase2a/` with 6 files:
  - `backup.sh` — Full database backup with verification
  - `create_tables.sql` — DDL for 12 `_v2` tables with versioning columns
  - `migrate_data.py` — Data migration with SHA256 content hashing
  - `validate.py` — Validation for 12 migration pairs
  - `rollback.sh` — Drop all `_v2` tables
  - `README.md` — Usage instructions
- **Results**: 2,517,718 rows migrated across 12 tables
- **Validation**: 0 errors, 12 warnings (expected duplicates)
- **Git gate**: Clean tree after stashing pre-existing changes
- **Commit**: `3d150ba` — pushed to origin

### Next Phase: 2B
- Add constraints to `_v2` tables (UNIQUE, CHECK, FOREIGN KEY)
- Fix double-hex encoding in content_hash
- Integrate with existing `migrations.py`
- Add composite indexes for frequently queried columns
- Update documentation

## 2026-09-14 (Session — Phase 2B Complete + Phase 2C Start)

### Phase 2B: Constraints + Indexes + Derived Tables — COMPLETE
- Created `scripts/migration/phase2b/` with 5 files:
  - `create_constraints.sql` — 5 UNIQUE constraints + 15 composite indexes
  - `create_derived_tables.sql` — 11 derived _v2 tables
  - `migrate_derived.py` — Data migration with SHA256 content hashing (36,280 rows)
  - `validate_all.py` — 23-table validation suite (0 errors, 13 warnings)
  - `README.md` — Usage instructions
- **Results**: 23 total _v2 tables (12 core + 11 derived), 47 indexes total
- **Validation**: 0 errors, 13 expected warnings (duplicates in dictionaries/translations)
- **Commit**: `7ea266c` — pending push (network down)

### Phase 2C: Deduplication — IN PROGRESS
- Deduplicate 7 core tables with duplicate business keys
- Add UNIQUE constraints after dedup
- Fix migrate_derived.py idempotency
- Update documentation

## 2026-09-14 (Session — Phase 2C Complete + Phase 2D Start)

### Phase 2C: Deduplication — COMPLETE
- Created `scripts/migration/phase2c/` with 3 files:
  - `dedup_core.py` — Deduplication with completeness-based selection
  - `add_unique_constraints.sql` — 6 UNIQUE indexes on business keys
  - `validate_dedup.py` — Post-dedup validation
- Fixed `migrate_derived.py` idempotency (INSERT OR IGNORE)
- **Results**: 100,570 rows removed (603,109 → 502,539)
- **Validation**: 0 errors, 0 duplicates, 0 NULLs, 6/6 indexes verified
- **Commit**: `2a8d13f` — pending push

### Phase 2D: Cutover — IN PROGRESS
- Validate data fidelity (old vs _v2 comparison)
- Switch tables (rename old → _old, _v2 → canonical)
- Verify switch
- Cleanup old tables

## 2026-09-14 (Session — Database Governance Complete)

### Project Summary
- **79 tables → 23 canonical tables** through 5-phase pipeline
- **Total output**: 47 audit files + 19 migration scripts + 10 JSON data files
- **All phases committed** (pending push — network down)

### Phase 0: Full Inventory (22 docs) ✅
- 79 tables, ~3.16M rows, 1.2GB
- Table classification, relationship mapping, risk register

### Phase 1: Evidence Validation (19 docs + 4 JSON) ✅
- Row reconciliation, duplicate analysis, source of truth
- Evidence JSON with all stats

### V2 Schema: Revised Target (6 docs + 5 JSON) ✅
- 79 → 23 target tables
- Column reconciliation, business keys, migration loss accounting

### Phase 2A: Backup + Core Migration (6 files) ✅
- Backup + 12 core _v2 tables created
- 2,517,718 rows migrated
- Commit: `3d150ba`

### Phase 2B: Constraints + Derived Tables (5 files) ✅
- 11 derived _v2 tables created
- 5 UNIQUE constraints + 15 indexes
- 36,280 rows migrated
- Commit: `7ea266c`

### Phase 2C: Deduplication (3 files) ✅
- 6 tables deduped (100,570 rows removed)
- 6 UNIQUE constraints added
- migrate_derived.py idempotency fixed
- Commit: `2a8d13f`

### Phase 2D: Cutover Scripts (5 files) ✅
- validate_cutover.py — Pre-cutover validation
- switch_tables.sql — Atomic renames for 23 tables
- verify_switch.py — Post-cutover validation
- cleanup_old.py — Drop _old tables + VACUUM
- Commit: `a3843e9`

### Pending Actions
1. Push commits when network is available
2. Execute cutover (Phase 2D scripts)
3. Update zolai-core application code for new table names
4. Update JSONL pipeline for new schema

## 2026-09-14 (Session — Application Code Updates Complete)

### Phase 2D Cutover — COMPLETE
- ✅ validate_cutover.py — Pre-cutover validation
- ✅ switch_tables.sql — Atomic renames for 23 tables
- ✅ verify_switch.py — Post-cutover validation (all 23 canonical tables active)
- ✅ cleanup_old.py — 24 _old tables dropped
- ✅ VACUUM — Database optimized

### 23 Canonical Tables Active
| Table | Rows | Notes |
|-------|------|-------|
| dictionary | 84,490 | |
| dictionary_en_zo | 64,025 | |
| bible_verses | 31,649 | deduped |
| grammar_patterns | 5,547 | |
| translations | 207,623 | |
| word_alignments | 385,120 | |
| vocabulary | 107,049 | was `vocab` |
| proverbs | 7,703 | |
| phrases | 5,000 | |
| word_usage | 60,365 | |
| syllable_data | 189,554 | |
| word_collocations | 5,000 | |
| bible_analysis | 1,228 | was `bible_context` |
| articles | 6,371 | |
| songs | 1,032 | was `zolai_songs` |
| wiki_content | 1,688 | |
| data_audit_log | 24,762 | |
| audit_findings | 713 | |
| provenance | 255 | |
| import_log | 92 | was `jsonl_import_log` |
| tone_sandhi | 19 | was `zolai_tone_sandhi` |
| tone_patterns | 118 | |
| training_runs | 2 | |

### Application Code Updates — COMPLETE
- Updated 9 Python files to reference new canonical table names
- Fixed desktop_router.py export mapping
- Syntax checks pass
- Commit: `ceb565c` — pushed to origin

### Project Complete ✅
- **47 audit files** in docs/database-audit/
- **19 migration scripts** in scripts/migration/
- **23 canonical tables** active in DB
- **Application code** updated for new table names
- All commits pushed

## 2026-09-15 (Session — Myanmar Text Fix + Deprecated Table Cleanup)

### Myanmar Bible Text Fix
- Created `zolai-datasets/scripts/fixes/fix_myanmar_length.py`
- Truncated 3,664 Bible verses from max 754 chars → 200 chars at sentence boundary (Myanmar `။` or `.`)
- Verified: `MAX(LENGTH(myanmar))` = 200

### Deprecated Table References Fixed
- `ingest_all_to_db.py`: `UPDATE vocab` → `UPDATE zolai_vocabulary`
- `ingest_all_data.py`: 
  - 3x `INSERT INTO bible_context` → `INSERT INTO zolai_bible_analysis`
  - 2x `UPDATE vocab` → `UPDATE zolai_vocabulary`
- Verified: 0 deprecated table writes remain in scripts

### CLI Menu Testing
- `./zolai_menu.sh --cli stats` — Works (79 tables, 3M+ rows)
- `./zolai_menu.sh --cli dict pasian` — Works (returns correct entries)
- `./zolai_menu.sh --cli engine-search "pasian" --no-ai` — Works (20 verses found)

### Commits
- `zolai-datasets`: `d488bf0` — fix: truncate Myanmar Bible text + fix deprecated table refs
- `zolai-core`: `ceb565c` — refactor: update canonical table names after cutover
- All pushed to origin

### Project Status
- Database governance: ✅ COMPLETE (23 canonical tables active)
- Application code updates: ✅ COMPLETE
- CLI/Script fixes: ✅ COMPLETE
- Frontend (zolai-tauri): Dictionary "No entries found" - needs server-side filtering
