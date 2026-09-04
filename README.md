# zolai-tauri — Offline Zolai desktop app

Tauri (Rust) shell bundling the FastAPI server + a local GGUF model for fully
offline Zolai use.

## Quick start
- Dev: `cargo run` (see `src-tauri`)
- Bundles the core server + Ollama GGUF locally — no cloud required.

## Connect
Speaks REST/GGUF to `zolai-core`. See `CONNECT.md`.
