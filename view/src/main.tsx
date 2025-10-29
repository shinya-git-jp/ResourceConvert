// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Router from "./router"; // router/index.tsx を import
import { DisplayStateProvider } from "./store/DisplayStateContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* ★ Provider でラップ */}
    <DisplayStateProvider>
      <Router />
    </DisplayStateProvider>
  </StrictMode>,
);
