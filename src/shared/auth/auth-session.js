import { clearTokens, saveAccessToken, saveRefreshToken } from "./token";
import {
  anonymousAuthState,
  validateLoginResult,
  validateRefreshResult,
} from "./auth-result";

let generation = 0;
let handlers = null;

export function getSessionGeneration() {
  return generation;
}

export function isCurrentSession(expectedGeneration) {
  return expectedGeneration === generation;
}

export function registerSessionHandlers(nextHandlers) {
  handlers = nextHandlers;
  return () => {
    if (handlers === nextHandlers) handlers = null;
  };
}

function persistSession(session, state) {
  saveAccessToken(session.accessToken);
  saveRefreshToken(session.refreshToken);
  handlers?.update(state);
}

export function replaceAuthSession(session, expectedGeneration = generation) {
  const state = validateLoginResult(session);
  if (!isCurrentSession(expectedGeneration)) throw new Error("Session changed during login");

  generation += 1;
  handlers?.clearCache();
  persistSession(session, state);
}

export function rotateAuthSession(session, expectedGeneration) {
  const state = validateRefreshResult(session);
  if (!isCurrentSession(expectedGeneration)) throw new Error("Session changed during refresh");

  persistSession(session, state);
  return session.accessToken;
}

// Logout, refresh failure and terminal 401 all use this synchronous fence.
export function terminateAuthSession(expectedGeneration = generation) {
  if (!isCurrentSession(expectedGeneration)) return;

  generation += 1;
  clearTokens();
  handlers?.clearCache();
  handlers?.update(anonymousAuthState());
}
