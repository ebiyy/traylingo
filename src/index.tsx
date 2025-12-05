/* @refresh reload */
import * as Sentry from "@sentry/solid";
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { PopupView } from "./components/PopupView";

Sentry.init({
  dsn: "https://12cc4e2328693a567ba7580e40f8b3f1@o4503930312261632.ingest.us.sentry.io/4510482273009664",
  sendDefaultPii: true,
});

const root = document.getElementById("root") as HTMLElement;
const hash = window.location.hash;
const isPopup = hash.startsWith("#/popup");

render(() => (isPopup ? <PopupView /> : <App />), root);
