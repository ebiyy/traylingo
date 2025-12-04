import { createSignal, onMount } from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";

function App() {
  const [original, setOriginal] = createSignal("");
  const [translated, setTranslated] = createSignal("");
  const [isTranslating, setIsTranslating] = createSignal(false);

  onMount(async () => {
    // Listen for shortcut trigger
    await listen("shortcut-triggered", async () => {
      const text = await readText();
      if (text) {
        setOriginal(text);
        setTranslated("");
        setIsTranslating(true);
        // Start translation
        invoke("translate", { text }).catch((err) => {
          setTranslated(`Error: ${err}`);
          setIsTranslating(false);
        });
      }
    });

    // Listen for translation chunks
    await listen<string>("translate-chunk", (event) => {
      setTranslated((prev) => prev + event.payload);
    });

    // Listen for translation completion
    await listen("translate-done", () => {
      setIsTranslating(false);
    });
  });

  return (
    <div class="flex h-screen bg-gray-900 text-gray-100">
      {/* Left pane - Original */}
      <div class="flex-1 p-4 border-r border-gray-700">
        <h2 class="text-sm font-medium text-gray-400 mb-2">Original</h2>
        <div class="text-base leading-relaxed">
          {original() || "Select text and press ⌘J"}
        </div>
      </div>

      {/* Right pane - Translation */}
      <div class="flex-1 p-4">
        <h2 class="text-sm font-medium text-gray-400 mb-2">
          Translation {isTranslating() && <span class="animate-pulse">...</span>}
        </h2>
        <div class="text-base leading-relaxed">
          {translated() || "Translation will appear here..."}
        </div>
      </div>
    </div>
  );
}

export default App;
