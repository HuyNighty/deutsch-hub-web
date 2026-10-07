import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import axios from "axios";
import { httpAdapter, resetHttpHandler } from "./http";
import { terminateAuthSession } from "@/shared/auth/auth-session";

axios.defaults.adapter = httpAdapter;

afterEach(() => {
  cleanup();
  terminateAuthSession();
  localStorage.clear();
  resetHttpHandler();
});
