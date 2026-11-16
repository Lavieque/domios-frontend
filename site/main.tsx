import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/dm-sans/index.css";
import "@fontsource/libre-caslon-display/400.css";
import "./site.css";
import { Site } from "./Site";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  </StrictMode>,
);
