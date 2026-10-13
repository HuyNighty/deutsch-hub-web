import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import InteractionHarness from "./InteractionHarness";

createRoot(document.getElementById("interaction-root")).render(
  <StrictMode><InteractionHarness /></StrictMode>,
);
