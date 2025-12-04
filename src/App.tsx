import { createSignal } from "solid-js";

function App() {
  const [original, setOriginal] = createSignal("");
  const [translated, setTranslated] = createSignal("");

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
        <h2 class="text-sm font-medium text-gray-400 mb-2">Translation</h2>
        <div class="text-base leading-relaxed">
          {translated() || "Translation will appear here..."}
        </div>
      </div>
    </div>
  );
}

export default App;
