import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ParticipantHarness from "./ParticipantHarness";

createRoot(document.getElementById("participant-root")).render(<StrictMode><ParticipantHarness /></StrictMode>);
