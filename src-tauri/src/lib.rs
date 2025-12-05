use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

static POPUP_READY: AtomicBool = AtomicBool::new(false);

mod anthropic;
mod error;
mod settings;

use settings::Settings;

#[tauri::command]
async fn translate(app: tauri::AppHandle, text: String, session_id: String) -> Result<(), String> {
    let api_key = settings::get_api_key(&app);
    let model = settings::get_model(&app);
    anthropic::translate_stream(app, text, session_id, api_key, model).await
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

/// macOS: Control dock icon visibility
#[cfg(target_os = "macos")]
mod macos {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};

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

/// Poll clipboard until content changes or timeout.
/// Returns true if clipboard changed, false if timeout.
fn wait_for_clipboard_change(timeout_ms: u64) -> bool {
    use arboard::Clipboard;

    let mut clipboard = match Clipboard::new() {
        Ok(c) => c,
        Err(_) => return false,
    };

    let original = clipboard.get_text().unwrap_or_default();
    let start = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);

    while start.elapsed() < timeout {
        if let Ok(current) = clipboard.get_text() {
            if current != original && !current.is_empty() {
                return true;
            }
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    false
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

fn show_popup(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("popup") {
        #[cfg(target_os = "macos")]
        {
            if let Ok(Some(monitor)) = window.primary_monitor() {
                let size = monitor.size();
                let x = (size.width as i32) - 420;
                let y = 30;
                let _ = window.set_position(tauri::Position::Physical(
                    tauri::PhysicalPosition::new(x, y),
                ));
            }
        }
        let _ = window.show();
        let _ = window.set_focus();
        // Emit event to trigger translation (backup for focus event)
        let _ = app.emit_to("popup", "popup-shown", ());
    }
}

fn hide_popup(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.hide();
    }
}

#[tauri::command]
async fn quick_translate(app: tauri::AppHandle, text: String) -> Result<String, String> {
    let api_key = settings::get_api_key(&app);
    let model = settings::get_model(&app);
    anthropic::translate_once(text, api_key, model).await
}

#[tauri::command]
fn close_popup(app: tauri::AppHandle) {
    hide_popup(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            translate,
            get_settings,
            save_settings,
            get_available_models,
            quick_translate,
            close_popup,
            popup_ready
        ])
        .setup(|app| {
            // Create tray menu
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

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
            app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
                #[cfg(target_os = "macos")]
                simulate_copy();

                // Poll for clipboard change (max 500ms)
                let _ = wait_for_clipboard_change(500);

                show_window(app);
                let _ = app.emit("shortcut-triggered", ());
            })?;

            // Register ⌘⌥J global shortcut (popup window)
            let popup_shortcut =
                Shortcut::new(Some(Modifiers::SUPER | Modifiers::ALT), Code::KeyJ);
            app.global_shortcut()
                .on_shortcut(popup_shortcut, |app, _shortcut, _event| {
                    #[cfg(target_os = "macos")]
                    simulate_copy();

                    // Poll for clipboard change (max 500ms)
                    let _ = wait_for_clipboard_change(500);

                    show_popup(app);
                })?;

            // Preload popup window to ensure JS is loaded before first use
            // Tauri v2 webview JS doesn't load until window is first shown
            if let Some(popup) = app.get_webview_window("popup") {
                // Window is positioned off-screen (x: 2000 in tauri.conf.json), so this won't be visible
                let _ = popup.show();

                // Wait for frontend ready signal (max 2000ms)
                let start = Instant::now();
                while !POPUP_READY.load(Ordering::SeqCst)
                    && start.elapsed().as_millis() < 2000
                {
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
                "main" => {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent window from closing, hide instead
                        api.prevent_close();
                        hide_window(app_handle);
                    }
                }
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
