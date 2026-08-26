let sessionUpdater = null;

export function registerSessionUpdater(updater) {
  sessionUpdater = updater;
}

export function updateAuthSession(session) {
  if (sessionUpdater) {
    sessionUpdater(session);
  }
}
