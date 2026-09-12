# Zolai Desktop (Local Dashboard)

<p align="center"><img src="logo.png" alt="Zolai AI" width="120"></p>

This folder contains the **Tauri 2** desktop wrapper for the existing Next.js app in `website/zolai-project`.

## What you get

- Local-first dashboard (same UI as web)
- Local SQLite mode (set `DATABASE_PROVIDER=sqlite`)
- Sidecar orchestration (Ollama, Next.js server, KG build scripts)

## Install (Linux)

### One-command installer (recommended)

```bash
bash desktop/scripts/install-linux.sh
```

### 1) System dependencies

Tauri needs a WebView + build deps.

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y \
  build-essential pkg-config libssl-dev \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### 2) Rust toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version
```

### 3) JS deps

```bash
cd website/zolai-project
bun install
```

## Run (dev)

### Web app only

```bash
cd website/zolai-project
bun dev
```

### Desktop shell (Tauri)

```bash
# from repo root
cd desktop/src-tauri
cargo run
```

## Build KG (local)

```bash
bash scripts/kg/build_kg.sh
```

Then open:
- `/mind` (3D KG)
- `/dashboard/analytics` (KG counts + report)

## Live logs (desktop)

In the desktop app, open:
- `/dashboard/analytics`

Click **Run KG build (desktop)** to run `scripts/kg/build_kg.sh` and stream logs into the page.

## Notes

- `cargo` is required to compile the desktop shell.
- Packaging is handled by `desktop/scripts/build-sidecars.sh` (now bundles Next standalone + portable Node; Ollama bundled on Linux amd64).
- Output installers/bundles are produced by: `cargo tauri build` (see `desktop/src-tauri/target/release/bundle/`).

---

## Part of the Zolai-AI org

This repo is a component of the **[Zolai-AI](https://github.com/Zolai-AI)** organization — see the
[org profile](https://github.com/Zolai-AI) for the full ecosystem and
[`.github/CONTRIBUTING.md`](https://github.com/Zolai-AI/.github/blob/main/CONTRIBUTING.md) to contribute.

`zolai-core` · `zolai-web` · `zolai-datasets` · `zolai-training` · `zolai-wiki` · `zolai-ai` (monorepo)


---

## Org context

Full project ecosystem, architecture, design, status & plans: **[Zolai AI Project Brain](https://github.com/Zolai-AI/.github/blob/main/docs/ZOLAI_AI_PROJECT_BRAIN.md)**.
Part of the [Zolai-AI](https://github.com/Zolai-AI) org.
