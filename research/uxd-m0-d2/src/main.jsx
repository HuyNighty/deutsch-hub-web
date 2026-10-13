import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ResearchHarness from "./ResearchHarness";

createRoot(document.getElementById("research-root")).render(
  <StrictMode><ResearchHarness /></StrictMode>,
);
