import { AxiosError } from "axios";

let handler = null;

export function setHttpHandler(next) {
  handler = next;
}

export function resetHttpHandler() {
  handler = null;
}

export async function httpAdapter(config) {
  if (!handler) throw new Error(`Unexpected HTTP request: ${config.url}`);
  return handler(config);
}

export function ok(config, result) {
  return { config, status: 200, statusText: "OK", headers: {}, data: { code: 1000, result } };
}

export function fail(config, status = 401) {
  throw new AxiosError("HTTP failure", AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code: 9999, message: "HTTP failure" },
  });
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
