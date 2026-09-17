# Zolai Tauri Desktop — Architecture

## Overview
Zolai Desktop is a Tauri 2 application that bundles the Zolai Core Python API as a managed sidecar process, providing a standalone desktop experience with full API capabilities.

## Architecture Components

### 1. Tauri Frontend (React + TypeScript)
- **Location**: `frontend/`
- **Framework**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + Shadcn
- **State**: TanStack React Query
- **Build**: `bun run build` → `frontend/dist/`

### 2. Rust Backend (Tauri)
- **Location**: `src-tauri/src/`
- **Modules**:
  - `main.rs` — App lifecycle, sidecar management, Tauri commands
  - `sidecar.rs` — Python API process management
- **Dependencies**: tauri 2, rusqlite, reqwest, tokio, serde

### 3. Python API Sidecar
- **Location**: `zolai-core/zolai/api/desktop_app.py`
- **Framework**: FastAPI + uvicorn
- **Entry**: `python -m zolai.api.desktop_app`
- **Features**: Foundation Engine, Gemini WebAPI, dictionary, Bible, training
- **Deps**: FastAPI, uvicorn, SQLAlchemy, httpx (no ML/torch)

### 4. Plugin System
- **Location**: `zolai-core/zolai/plugins/`
- **Base**: Abstract `Plugin` class with `name`, `init()`, `cleanup()`, `is_available()`
- **Discovery**: Auto-discovery via `pkgutil` (module-level `plugin` attribute)
- **Plugins**: `GeminiWebAPIPlugin` (cookie + API key auth)

### 5. Gemini WebAPI Integration
- **Location**: `zolai-core/zolai/llm/gemini/cookies.py`
- **Auth**: Browser cookie extraction (Chrome/Chromium/Brave) via `browser-cookie3`
- **Fallback**: `GEMINI_API_KEY` environment variable
- **Cache**: `~/.cache/zolai/gemini/cookies.json` (1-hour TTL)

## Sidecar Lifecycle

```
App Launch
    ↓
main.rs setup()
    ↓
SidecarManager::start()
    ↓
Spawn Python process (desktop_app.py)
    ↓
Health check polling (GET /health)
    ↓
Frontend connects to API
    ↓
App Close
    ↓
SidecarManager::stop() → SIGTERM
```

## Tauri Commands

| Command | Description |
|---------|-------------|
| `api_status` | Get sidecar running status, port, PID |
| `api_start` | Start the Python API sidecar |
| `api_stop` | Stop the Python API sidecar |
| `db_init` | Initialize SQLite database |
| `db_lookup_word` | Search dictionary |
| `db_search_bible` | Search Bible verses |
| `db_count` | Count table rows |

## Database Strategy
- **Desktop**: Minimal SQLite subset bundled in app resources
- **Location**: `~/Zolai/zolai.db` (user-writable)
- **Update**: UI button to pull from download URL or file picker
- **Server**: Full 2.3GB database on server

## Build Modes

### Desktop (Standalone)
```bash
# Build Python sidecar
cd zolai-core && bash scripts/desktop/build_sidecar.sh

# Build Tauri app
cd zolai-tauri && bun run tauri build
```

### Server (Minimal)
```bash
# Run minimal server
cd zolai-core && python server.py

# Or with uvicorn
cd zolai-core && uvicorn zolai.api.server:app --host 0.0.0.0 --port 8000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ZOLAI_HOST` | `127.0.0.1` | API bind host |
| `ZOLAI_PORT` | `8000` | API bind port |
| `SQLITE_PATH` | `data/zolai.db` | SQLite database path |
| `GEMINI_API_KEY` | — | Gemini API key (fallback) |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |

## Security
- Desktop: API bound to localhost only (127.0.0.1)
- Server: Configurable bind address, CORS, auth
- Secrets: `.env` only, never committed
- Cookies: Cached locally with TTL, not shared
