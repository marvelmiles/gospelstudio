import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./fonts";
import "./index.css";
import "./pwa";
import clearEverything, { FRESH_START_MESSAGE } from "./lib/clearEverything";
import { hasIncompatibleDatabase } from "./lib/storage";
import routes from "./routes";

const PROJECTION_PATHS = new Set([
  routes.presentWindow(),
  routes.streamWindow(),
]);

const loadRoot = () =>
  PROJECTION_PATHS.has(window.location.pathname)
    ? import("./ProjectionApp")
    : import("./App");

const bootstrap = async () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("reset")) {
    await clearEverything();
  } else if (await hasIncompatibleDatabase()) {
    await clearEverything(FRESH_START_MESSAGE);
  }

  const { default: Root } = await loadRoot();
  const router = createBrowserRouter([{ path: "*", element: <Root /> }]);

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
};

void bootstrap();
