use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

static POPUP_READY: AtomicBool = AtomicBool::new(false);

/// Global Sentry guard to keep the client alive for the entire program lifetime.
/// WHY: Moving the guard into Tauri's managed state caused the client to become
/// disabled. Keeping it in a static ensures it lives as long as the process.
/// Using Mutex to allow taking (dropping) the guard if telemetry is disabled.
static SENTRY_GUARD: Mutex<Option<sentry::ClientInitGuard>> = Mutex::new(None);

mod anthropic;
mod error;
mod settings;

use settings::Settings;

#[tauri::command]
async fn translate(app: tauri::AppHandle, text: String, session_id: String) -> Result<(), String> {
    let current_settings = settings::get_settings(&app);
    if current_settings.api_key.is_empty() {
        let err = error::TranslateError::ApiKeyMissing;
        return Err(serde_json::to_string(&err).unwrap());
    }
    anthropic::translate_stream(
        app,
        text,
        session_id,
        current_settings.api_key,
        current_settings.model,
    )
    .await
}

#[tauri::command]
fn get_settings(app: tauri::AppHandle) -> Settings {
    settings::get_settings(&app)
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, new_settings: Settings) -> Result<(), String> {
    settings::save_settings(&app, &new_settings)
}

#[tauri::command]
fn get_available_models() -> Vec<(String, String)> {
    settings::AVAILABLE_MODELS
        .iter()
        .map(|(id, name)| (id.to_string(), name.to_string()))
        .collect()
}

#[tauri::command]
fn clear_translation_cache(app: tauri::AppHandle) -> Result<(), String> {
    settings::clear_translation_cache(&app)
}

#[tauri::command]
fn get_error_history(app: tauri::AppHandle) -> Vec<settings::ErrorHistoryEntry> {
    settings::get_error_history(&app)
}

#[tauri::command]
fn clear_error_history(app: tauri::AppHandle) -> Result<(), String> {
    settings::clear_error_history(&app)
}

/// macOS: Control dock icon visibility and app focus
#[cfg(target_os = "macos")]
mod macos {
    use objc2::rc::Retained;
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSApplication, NSApplicationActivationOptions, NSApplicationActivationPolicy,
        NSRunningApplication, NSWorkspace,
    };
    use std::sync::Mutex;

    /// Stores the app that was active before showing the popup.
    /// WHY: When popup closes, macOS focuses a random window. We need to restore
    /// focus to the original app. This is cleared by restore_frontmost_app().
    static PREVIOUS_APP: Mutex<Option<Retained<NSRunningApplication>>> = Mutex::new(None);

    pub fn set_dock_visible(visible: bool) {
        if let Some(mtm) = MainThreadMarker::new() {
            let app = NSApplication::sharedApplication(mtm);
            if visible {
                app.setActivationPolicy(NSApplicationActivationPolicy::Regular);
                app.activate();
            } else {
                app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);
            }
        }
    }

    /// Save the currently frontmost application before showing popup.
    ///
    /// WHY check is_some(): The global shortcut can trigger show_popup() multiple times
    /// in quick succession. Without this guard, the second call would overwrite the
    /// saved app with "traylingo" itself (since popup is now frontmost), breaking
    /// the restore logic.
    pub fn save_frontmost_app() {
        let mut prev = PREVIOUS_APP.lock().unwrap();
        if prev.is_some() {
            return;
        }

        let workspace = NSWorkspace::sharedWorkspace();
        if let Some(app) = workspace.frontmostApplication() {
            *prev = Some(app);
        }
    }

    /// Restore focus to the previously saved application.
    ///
    /// WHY use take(): Consumes the stored app reference so subsequent calls are no-ops.
    /// This handles cases where hide_popup() is called multiple times (e.g., Escape key
    /// followed by focus loss event).
    pub fn restore_frontmost_app() {
        let app = {
            let mut prev = PREVIOUS_APP.lock().unwrap();
            prev.take()
        };
        if let Some(app) = app {
            app.activateWithOptions(NSApplicationActivationOptions::empty());
        }
    }
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            hide_window(app);
        } else {
            show_window(app);
        }
    }
}

fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        macos::set_dock_visible(true);

        // Restore saved position if available
        if let Some(pos) = settings::get_window_position(app, "main") {
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(
                pos.x, pos.y,
            )));
        }

        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn hide_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();

        #[cfg(target_os = "macos")]
        macos::set_dock_visible(false);
    }
}

/// Poll clipboard until content changes from original or timeout.
/// Returns the new clipboard text if changed, None if timeout.
///
/// NOTE: First trigger after app launch often times out (works on second try).
/// This may be due to:
/// - macOS accessibility permission delays
/// - osascript cold start latency
/// - Clipboard daemon initialization
///
/// See: https://github.com/ebiyy/traylingo/issues/22
fn wait_for_clipboard_change_from(original: &str, timeout_ms: u64) -> Option<String> {
    use arboard::Clipboard;

    let mut clipboard = match Clipboard::new() {
        Ok(c) => c,
        Err(_) => return None,
    };

    let start = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);

    while start.elapsed() < timeout {
        if let Ok(current) = clipboard.get_text() {
            if current != original && !current.trim().is_empty() {
                return Some(current);
            }
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    None
}

/// Simulate ⌘C to copy selected text.
/// Releases Option, Shift, and Control keys first to prevent modifier key interference
/// (e.g., when triggered via ⌘⌥J, the Option key might still be held down).
#[cfg(target_os = "macos")]
fn simulate_copy() {
    use std::process::Command;
    // WHY: Release modifier keys before sending ⌘C
    // When user triggers ⌘⌥J, the Option key is still held down.
    // Some apps (e.g., VSCode webview) interpret ⌘⌥C differently than ⌘C.
    let _ = Command::new("osascript")
        .args([
            "-e",
            r#"tell application "System Events"
    key up {option, shift, control}
    keystroke "c" using command down
end tell"#,
        ])
        .output();
}

#[tauri::command]
fn popup_ready() {
    POPUP_READY.store(true, Ordering::SeqCst);
}

/// Calculate popup position based on cursor location with edge detection
#[cfg(target_os = "macos")]
fn calculate_popup_position(app: &tauri::AppHandle) -> Option<(i32, i32)> {
    const POPUP_WIDTH: i32 = 400;
    const POPUP_HEIGHT: i32 = 300; // Estimated max height
    const OFFSET: i32 = 15;
    const MENU_BAR_HEIGHT: i32 = 25;

    // Get cursor position from AppHandle (works even when window is hidden)
    let cursor = match app.cursor_position() {
        Ok(c) => c,
        Err(e) => {
            log::warn!("Failed to get cursor position: {:?}", e);
            return None;
        }
    };
    let cursor_x = cursor.x as i32;
    let cursor_y = cursor.y as i32;

    // TODO: Multi-monitor detection sometimes fails (returns None) even when cursor
    // is clearly on a monitor. This may be a Tauri API issue or coordinate mismatch.
    // When this happens, popup falls back to primary monitor top-right position.
    // See: https://github.com/ebiyy/traylingo/issues/21
    let monitor = match app.monitor_from_point(cursor.x, cursor.y) {
        Ok(Some(m)) => m,
        Ok(None) => {
            log::warn!("No monitor found at cursor position");
            return None;
        }
        Err(e) => {
            log::warn!("Failed to get monitor: {:?}", e);
            return None;
        }
    };
    let mon_pos = monitor.position();
    let mon_size = monitor.size();

    let mon_right = mon_pos.x + mon_size.width as i32;
    let mon_bottom = mon_pos.y + mon_size.height as i32;
    let mon_top = mon_pos.y + MENU_BAR_HEIGHT;

    // Default: bottom-right of cursor
    let mut x = cursor_x + OFFSET;
    let mut y = cursor_y + OFFSET;

    // Edge detection: flip if needed
    if x + POPUP_WIDTH > mon_right {
        x = cursor_x - POPUP_WIDTH - OFFSET;
    }
    if y + POPUP_HEIGHT > mon_bottom {
        y = cursor_y - POPUP_HEIGHT - OFFSET;
    }

    // Clamp to monitor bounds
    x = x.max(mon_pos.x);
    y = y.max(mon_top);

    Some((x, y))
}

fn show_popup(app: &tauri::AppHandle, clipboard_text: Option<String>) {
    if let Some(window) = app.get_webview_window("popup") {
        // Save frontmost app before showing popup
        #[cfg(target_os = "macos")]
        macos::save_frontmost_app();

        // Position popup near cursor
        #[cfg(target_os = "macos")]
        {
            if let Some((x, y)) = calculate_popup_position(app) {
                let _ = window.set_position(tauri::Position::Physical(
                    tauri::PhysicalPosition::new(x, y),
                ));
            }
            // Fallback: primary monitor top-right (rare case)
            else if let Ok(Some(monitor)) = window.primary_monitor() {
                let size = monitor.size();
                let _ = window.set_position(tauri::Position::Physical(
                    tauri::PhysicalPosition::new((size.width as i32) - 420, 30),
                ));
            }
        }

        let _ = window.show();
        let _ = window.set_focus();
        // Pass clipboard text via event to avoid race condition with JS clipboard access
        let _ = app.emit_to("popup", "popup-shown", clipboard_text);
    }
}

fn hide_popup(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.hide();

        // Restore focus to the previously frontmost app
        #[cfg(target_os = "macos")]
        macos::restore_frontmost_app();
    }
}

#[tauri::command]
async fn quick_translate(app: tauri::AppHandle, text: String) -> Result<String, String> {
    let current_settings = settings::get_settings(&app);
    if current_settings.api_key.is_empty() {
        let err = error::TranslateError::ApiKeyMissing;
        return Err(serde_json::to_string(&err).unwrap());
    }
    anthropic::translate_once(&app, text, current_settings.api_key, current_settings.model).await
}

#[tauri::command]
fn close_popup(app: tauri::AppHandle) {
    hide_popup(&app);
}

// Frontend log entry for unified logging
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogEntry {
    ts: String,
    level: String,
    scope: String,
    message: String,
    correlation_id: Option<String>,
    data: Option<serde_json::Value>,
}

#[tauri::command]
fn app_log(entry: LogEntry) {
    let corr = entry.correlation_id.as_deref().unwrap_or("-");
    let data_str = entry
        .data
        .as_ref()
        .map(|d| format!(" | data={}", d))
        .unwrap_or_default();

    let line = format!(
        "[{}] [{}] [corr={}] {}{}",
        entry.ts, entry.scope, corr, entry.message, data_str
    );

    match entry.level.as_str() {
        "debug" => log::debug!("{}", line),
        "info" => log::info!("{}", line),
        "warn" => log::warn!("{}", line),
        "error" => log::error!("{}", line),
        _ => log::info!("{}", line),
    }
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

/// Check for updates and notify user of result.
/// Spawns an async task to avoid blocking the menu event handler.
fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_updater::UpdaterExt;

    tauri::async_runtime::spawn(async move {
        match app.updater() {
            Ok(updater) => match updater.check().await {
                Ok(Some(update)) => {
                    log::info!("Update available: {}", update.version);
                    // Emit event to frontend to show update dialog
                    let _ = app.emit(
                        "update-available",
                        serde_json::json!({
                            "version": update.version,
                            "body": update.body
                        }),
                    );
                }
                Ok(None) => {
                    log::info!("No update available");
                    let _ = app.emit("update-not-available", ());
                }
                Err(e) => {
                    log::error!("Failed to check for updates: {}", e);
                    let _ = app.emit("update-error", e.to_string());
                }
            },
            Err(e) => {
                log::error!("Failed to get updater: {}", e);
                let _ = app.emit("update-error", e.to_string());
            }
        }
    });
}

/// Custom panic handler that ensures Sentry flush before process abort.
/// WHY: Sentry's PanicIntegration uses thread-local Hub which can fail in spawned threads.
/// This handler bypasses that by using Client::capture_event() directly.
///
/// Takes the default panic hook (saved BEFORE sentry::init) to avoid calling
/// Sentry's PanicIntegration handler, which would cause duplicate events.
#[allow(deprecated)] // PanicInfo is deprecated in favor of PanicHookInfo (Rust 1.81+), but MSRV is 1.77.2
fn install_panic_handler_with_flush(
    default_hook: Box<dyn Fn(&std::panic::PanicInfo<'_>) + Sync + Send + 'static>,
) {
    // Take Sentry's hook but don't use it (avoids duplicate events)
    let _sentry_hook = std::panic::take_hook();

    std::panic::set_hook(Box::new(move |panic_info| {
        // Get client from main hub (captured at sentry::init time)
        if let Some(client) = sentry::Hub::main().client() {
            if client.is_enabled() {
                // Build event manually
                let event = sentry::protocol::Event {
                    message: Some(panic_info.to_string()),
                    level: sentry::Level::Fatal,
                    ..Default::default()
                };

                // Use Client::capture_event directly (bypasses thread-local Hub issues)
                client.capture_event(event, None);

                // Flush with timeout to ensure event is sent before abort
                client.flush(Some(std::time::Duration::from_secs(2)));
            }
        }

        // Call ONLY the default hook (stderr output, backtrace)
        // NOT Sentry's hook - avoids duplicate events
        default_hook(panic_info);
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // =========================================================================
    // Phase 0: Save the REAL default panic hook BEFORE sentry::init
    // =========================================================================
    // WHY: sentry::init installs PanicIntegration which overwrites the panic hook.
    // We save the default hook here so we can call it later without triggering
    // Sentry's handler (which would cause duplicate events).
    let default_hook = std::panic::take_hook();

    // =========================================================================
    // Phase 1: Early Sentry init (captures panics during Tauri initialization)
    // =========================================================================
    // NOTE: DSN is injected via build-time env var (SENTRY_DSN_BACKEND).
    // For OSS builds without DSN, Sentry is disabled.
    // If user has disabled telemetry, we'll drop the guard in setup().
    //
    // IMPORTANT: Privacy Protection - Sentry PII Masking
    // This app handles sensitive user data (clipboard text for translation).
    // We MUST scrub any text content before sending to Sentry.
    // See also: src/index.tsx for frontend Sentry configuration.
    let dsn = option_env!("SENTRY_DSN_BACKEND").unwrap_or("");
    if !dsn.is_empty() {
        let guard = sentry::init((
            dsn,
            sentry::ClientOptions {
                release: sentry::release_name!(),
                environment: Some(if cfg!(debug_assertions) {
                    "development".into()
                } else {
                    "production".into()
                }),
                before_send: Some(Arc::new(|mut event| {
                    // WHY: Users paste sensitive content (emails, passwords, private messages)
                    // for translation. This data MUST NOT be sent to external services.
                    event.extra.remove("text");
                    event.extra.remove("translation");
                    event.extra.remove("clipboard");
                    Some(event)
                })),
                ..Default::default()
            },
        ));

        // Store guard in static to keep client alive for entire program lifetime
        // WHY: Moving guard into Tauri's managed state caused client to become disabled
        *SENTRY_GUARD.lock().unwrap() = Some(guard);

        // Install panic handler, passing the default hook saved before sentry::init
        // This ensures we don't call Sentry's PanicIntegration (avoids duplicate events)
        install_panic_handler_with_flush(default_hook);
    }

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            translate,
            get_settings,
            save_settings,
            get_available_models,
            clear_translation_cache,
            get_error_history,
            clear_error_history,
            quick_translate,
            close_popup,
            popup_ready,
            app_log,
            open_external_url
        ])
        .setup(|app| {
            // =================================================================
            // Phase 2: Check telemetry setting and disable Sentry if opted out
            // =================================================================
            let user_settings = settings::get_settings(app.handle());

            if !user_settings.send_telemetry {
                // User opted out - take and drop guard to disable Sentry
                // NOTE: Panics during startup were still captured (opt-in default),
                // but future events won't be sent.
                if let Some(guard) = SENTRY_GUARD.lock().unwrap().take() {
                    drop(guard);
                }
            }
            // If telemetry is ON, guard stays in SENTRY_GUARD for entire program lifetime

            // Create tray menu
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let check_update = MenuItem::with_id(
                app,
                "check_update",
                "Check for Updates...",
                true,
                None::<&str>,
            )?;
            let privacy = MenuItem::with_id(app, "privacy", "Privacy Policy", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &check_update, &privacy, &quit])?;

            // Load tray icon from embedded bytes (monochrome template)
            let icon = Image::from_bytes(include_bytes!("../icons/trayTemplate@2x.png"))
                .expect("Failed to load tray icon");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        show_window(app);
                    }
                    "check_update" => {
                        check_for_updates(app.clone());
                    }
                    "privacy" => {
                        let _ =
                            open::that("https://github.com/ebiyy/traylingo/blob/main/PRIVACY.md");
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Register ⌘J global shortcut (main window)
            let shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyJ);
            app.global_shortcut()
                .on_shortcut(shortcut, |app, _shortcut, event| {
                    // WHY: tauri-plugin-global-shortcut fires twice (Pressed + Released).
                    // Only handle Pressed to prevent duplicate translation requests.
                    // See: https://github.com/tauri-apps/plugins-workspace/issues/1748
                    if event.state != ShortcutState::Pressed {
                        return;
                    }

                    // Capture clipboard content BEFORE simulating copy
                    let original_clipboard = arboard::Clipboard::new()
                        .ok()
                        .and_then(|mut c| c.get_text().ok())
                        .unwrap_or_default();

                    #[cfg(target_os = "macos")]
                    simulate_copy();

                    // Poll for clipboard change (max 500ms)
                    let _ = wait_for_clipboard_change_from(&original_clipboard, 500);

                    show_window(app);
                    let _ = app.emit("shortcut-triggered", ());
                })?;

            // Register ⌃⌥J global shortcut (popup window)
            let popup_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyJ);
            app.global_shortcut()
                .on_shortcut(popup_shortcut, |app, _shortcut, event| {
                    // WHY: tauri-plugin-global-shortcut fires twice (Pressed + Released).
                    // Only handle Pressed to prevent duplicate translation requests.
                    // See: https://github.com/tauri-apps/plugins-workspace/issues/1748
                    if event.state != ShortcutState::Pressed {
                        return;
                    }

                    // Capture clipboard content BEFORE simulating copy
                    let original_clipboard = arboard::Clipboard::new()
                        .ok()
                        .and_then(|mut c| c.get_text().ok())
                        .unwrap_or_default();

                    #[cfg(target_os = "macos")]
                    simulate_copy();

                    // Poll for clipboard change from original (max 500ms)
                    let clipboard_text = wait_for_clipboard_change_from(&original_clipboard, 500);

                    show_popup(app, clipboard_text);
                })?;

            // Preload popup window to ensure JS is loaded before first use
            // Tauri v2 webview JS doesn't load until window is first shown
            if let Some(popup) = app.get_webview_window("popup") {
                // Window is positioned off-screen (x: 2000 in tauri.conf.json), so this won't be visible
                let _ = popup.show();

                // Wait for frontend ready signal (max 2000ms)
                let start = Instant::now();
                while !POPUP_READY.load(Ordering::SeqCst) && start.elapsed().as_millis() < 2000 {
                    std::thread::sleep(Duration::from_millis(10));
                }

                let _ = popup.hide();
            }

            // Log plugin (debug only)
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        match event {
            RunEvent::WindowEvent { label, event, .. } => match label.as_str() {
                "main" => match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        // Prevent window from closing, hide instead
                        api.prevent_close();
                        hide_window(app_handle);
                    }
                    WindowEvent::Moved(position) => {
                        // Save window position when moved
                        let _ = settings::save_window_position(
                            app_handle, "main", position.x, position.y,
                        );
                    }
                    _ => {}
                },
                "popup" => match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        hide_popup(app_handle);
                    }
                    WindowEvent::Focused(false) => {
                        // Hide popup when it loses focus (click outside)
                        hide_popup(app_handle);
                    }
                    _ => {}
                },
                _ => {}
            },
            RunEvent::ExitRequested { api, .. } => {
                // Prevent app exit when all windows are hidden
                api.prevent_exit();
            }
            _ => {}
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_popup_ready_sets_flag() {
        // Reset state before test
        POPUP_READY.store(false, Ordering::SeqCst);

        assert!(!POPUP_READY.load(Ordering::SeqCst));
        popup_ready();
        assert!(POPUP_READY.load(Ordering::SeqCst));
    }

    #[test]
    fn test_popup_ready_idempotent() {
        // Calling popup_ready multiple times should be safe
        POPUP_READY.store(false, Ordering::SeqCst);

        popup_ready();
        popup_ready();
        popup_ready();

        assert!(POPUP_READY.load(Ordering::SeqCst));
    }

    // NOTE: Clipboard tests require GUI environment and are tested via `pnpm tauri dev`
    // Edge cases covered by manual testing:
    // - Timeout behavior (returns false after timeout)
    // - Zero timeout (returns immediately)
    // - Clipboard change detection (returns true early when content changes)
    // - Empty clipboard handling (graceful error handling)
}
