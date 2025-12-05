/* @refresh reload */
import * as Sentry from "@sentry/solid";
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { PopupView } from "./components/PopupView";

Sentry.init({
  dsn: "https://REDACTED",
  sendDefaultPii: true,
});

const root = document.getElementById("root") as HTMLElement;
const hash = window.location.hash;
const isPopup = hash.startsWith("#/popup");

render(() => (isPopup ? <PopupView /> : <App />), root);
