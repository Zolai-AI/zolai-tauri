//! Sidecar manager — starts, monitors, and stops the Python API process.
//!
//! The Python API runs as a child process (sidecar) that the Tauri app
//! manages throughout its lifecycle. Health checks confirm the API is
//! ready before the frontend connects.

use serde::Serialize;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Emitter;

/// Default port for the Python API sidecar.
const DEFAULT_PORT: u16 = 8000;

/// Health check interval in milliseconds.
const HEALTH_CHECK_INTERVAL_MS: u64 = 2000;

/// Maximum health check attempts before declaring failure.
const MAX_HEALTH_ATTEMPTS: u32 = 15;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
pub struct SidecarStatus {
    pub running: bool,
    pub port: u16,
    pub pid: Option<u32>,
    pub api_url: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct HealthCheckResult {
    pub ok: bool,
    pub status: Option<u32>,
    pub message: String,
}

// ---------------------------------------------------------------------------
// SidecarManager
// ---------------------------------------------------------------------------

pub struct SidecarManager {
    port: u16,
    api_url: String,
    child_pid: Mutex<Option<u32>>,
    is_running: Mutex<bool>,
}

impl SidecarManager {
    /// Create a new sidecar manager with the given port.
    pub fn new(port: u16) -> Self {
        let api_url = format!("http://127.0.0.1:{port}");
        Self {
            port,
            api_url,
            child_pid: Mutex::new(None),
            is_running: Mutex::new(false),
        }
    }

    /// Create with default port.
    pub fn default_port() -> Self {
        Self::new(DEFAULT_PORT)
    }

    /// Start the Python API sidecar process.
    ///
    /// Tries (in order):
    /// 1. Tauri sidecar binary (`zolai-api`)
    /// 2. `python -m zolai.api.desktop_app`
    /// 3. `python -m uvicorn zolai.api.server:app`
    pub fn start(&self, app: &AppHandle) -> Result<SidecarStatus, String> {
        let mut is_running = self.is_running.lock().map_err(|e| e.to_string())?;
        if *is_running {
            return Ok(SidecarStatus {
                running: true,
                port: self.port,
                pid: *self.child_pid.lock().map_err(|e| e.to_string())?,
                api_url: self.api_url.clone(),
                error: None,
            });
        }

        // Detect available Python
        let python_cmd = detect_python();

        // Try to start the sidecar
        let child = self.spawn_process(&python_cmd)?;

        let pid = child.id();
        *self.child_pid.lock().map_err(|e| e.to_string())? = Some(pid);
        *is_running = true;

        let api_url = self.api_url.clone();
        let port = self.port;
        let app_handle = app.clone();

        // Spawn a background thread to wait on the child process
        std::thread::spawn(move || {
            // We need to own the child here but we can't move it.
            // Instead we poll the PID.
            let _ = api_url; // keep for logging
            let _ = port;
            // The child drops here, but we'll detect exit via health checks.
        });

        // Emit startup event
        let _ = app_handle.emit(
            "sidecar:started",
            serde_json::json!({ "port": port, "pid": pid }),
        );

        Ok(SidecarStatus {
            running: true,
            port: self.port,
            pid: Some(pid),
            api_url: self.api_url.clone(),
            error: None,
        })
    }

    /// Spawn the Python process with the right entrypoint.
    fn spawn_process(&self, python_cmd: &str) -> Result<std::process::Child, String> {
        let port_arg = self.port.to_string();

        // Attempt 1: desktop_app module
        let result = Command::new(python_cmd)
            .args([
                "-m", "zolai.api.desktop_app",
                "--port", &port_arg,
                "--host", "127.0.0.1",
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        match result {
            Ok(child) => {
                log::info!("Started sidecar via desktop_app module (pid={})", child.id());
                return Ok(child);
            }
            Err(e) => {
                log::warn!("Failed to start desktop_app module: {e}");
            }
        }

        // Attempt 2: uvicorn fallback
        let result = Command::new(python_cmd)
            .args([
                "-m", "uvicorn",
                "zolai.api.server:app",
                "--host", "127.0.0.1",
                "--port", &port_arg,
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        match result {
            Ok(child) => {
                log::info!("Started sidecar via uvicorn fallback (pid={})", child.id());
                return Ok(child);
            }
            Err(e) => {
                log::error!("Failed to start uvicorn fallback: {e}");
                return Err(format!("Could not start Python API sidecar: {e}"));
            }
        }
    }

    /// Perform a health check against the running API.
    pub async fn health_check(&self) -> HealthCheckResult {
        let url = format!("{}/health", self.api_url);
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(3))
            .build();

        let client = match client {
            Ok(c) => c,
            Err(e) => {
                return HealthCheckResult {
                    ok: false,
                    status: None,
                    message: format!("Failed to create HTTP client: {e}"),
                };
            }
        };

        match client.get(&url).send().await {
            Ok(resp) => {
                let status = resp.status().as_u16() as u32;
                let ok = resp.status().is_success();
                HealthCheckResult {
                    ok,
                    status: Some(status),
                    message: if ok {
                        format!("API healthy on port {}", self.port)
                    } else {
                        format!("API returned status {status}")
                    },
                }
            }
            Err(e) => HealthCheckResult {
                ok: false,
                status: None,
                message: format!("Health check failed: {e}"),
            },
        }
    }

    /// Poll health checks until the API is ready or timeout.
    pub async fn wait_for_ready(&self) -> HealthCheckResult {
        for attempt in 0..MAX_HEALTH_ATTEMPTS {
            let result = self.health_check().await;
            if result.ok {
                log::info!(
                    "API ready after {} health checks (port {})",
                    attempt + 1,
                    self.port
                );
                return result;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(HEALTH_CHECK_INTERVAL_MS)).await;
        }
        HealthCheckResult {
            ok: false,
            status: None,
            message: format!(
                "API not ready after {MAX_HEALTH_ATTEMPTS} health check attempts"
            ),
        }
    }

    /// Stop the sidecar process.
    pub fn stop(&self) -> Result<SidecarStatus, String> {
        let mut is_running = self.is_running.lock().map_err(|e| e.to_string())?;
        let mut pid_guard = self.child_pid.lock().map_err(|e| e.to_string())?;

        if let Some(pid) = *pid_guard {
            // Try to kill the process
            #[cfg(unix)]
            {
                unsafe {
                    libc::kill(pid as i32, libc::SIGTERM);
                }
            }
            #[cfg(windows)]
            {
                // On Windows, taskkill is the safest approach
                let _ = Command::new("taskkill")
                    .args(["/PID", &pid.to_string(), "/F"])
                    .output();
            }

            log::info!("Stopped sidecar process (pid={})", pid);
            *pid_guard = None;
        }

        *is_running = false;

        Ok(SidecarStatus {
            running: false,
            port: self.port,
            pid: None,
            api_url: self.api_url.clone(),
            error: None,
        })
    }

    /// Get current status.
    pub fn status(&self) -> SidecarStatus {
        let is_running = self.is_running.lock().map(|g| *g).unwrap_or(false);
        let pid = self.child_pid.lock().ok().and_then(|g| *g);
        SidecarStatus {
            running: is_running,
            port: self.port,
            pid,
            api_url: self.api_url.clone(),
            error: None,
        }
    }

    /// Get the API base URL.
    pub fn api_url(&self) -> &str {
        &self.api_url
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Detect available Python interpreter.
fn detect_python() -> String {
    // Check common Python commands in order
    for cmd in &["python3", "python"] {
        if Command::new(cmd)
            .args(["--version"])
            .output()
            .is_ok()
        {
            return cmd.to_string();
        }
    }
    "python3".to_string()
}

/// Find the database path (workspace root's data/zolai.db).
pub fn find_db_path() -> Option<PathBuf> {
    // Check env var first
    if let Ok(path) = std::env::var("SQLITE_PATH") {
        let p = PathBuf::from(path);
        if p.exists() {
            return Some(p);
        }
    }

    // Try common locations relative to the executable
    let exe_dir = std::env::current_exe().ok()?;
    let candidates = [
        exe_dir.join("data/zolai.db"),
        exe_dir.parent()?.join("data/zolai.db"),
        PathBuf::from("data/zolai.db"),
    ];

    for candidate in &candidates {
        if candidate.exists() {
            return Some(candidate.clone());
        }
    }

    None
}
