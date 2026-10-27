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


// RF1-B3-R2: JSDOM matchMedia compatibility
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
}
