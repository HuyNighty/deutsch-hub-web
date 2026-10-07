import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { anonymousAuthState, buildAuthState } from "@/shared/auth/auth-result";
import {
  getSessionGeneration,
  registerSessionHandlers,
  replaceAuthSession,
  terminateAuthSession,
} from "@/shared/auth/auth-session";
import { refreshAccessToken } from "@/shared/api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState(() => {
    const restored = buildAuthState(getAccessToken());
    return restored.isAuthenticated ? restored : anonymousAuthState("CHECKING");
  });

  useEffect(() => {
    const unregister = registerSessionHandlers({
      update: setAuthState,
      clearCache() {
        // Cancellation starts synchronously; clear before exposing the next identity.
        void queryClient.cancelQueries();
        queryClient.clear();
      },
    });

    const restored = buildAuthState(getAccessToken());
    if (restored.isAuthenticated) {
      setAuthState(restored);
    } else if (getRefreshToken()) {
      // The coordinator shares this bootstrap with StrictMode's second effect.
      void refreshAccessToken(getSessionGeneration()).catch(() => {});
    } else {
      terminateAuthSession();
    }

    return unregister;
  }, [queryClient]);

  const setSession = useCallback((session, expectedGeneration) => {
    replaceAuthSession(session, expectedGeneration);
  }, []);
  const logout = useCallback(() => terminateAuthSession(), []);
  const hasRole = useCallback(
    (role) => authState.user?.roles.includes(role) ?? false,
    [authState.user],
  );
  const hasAnyRole = useCallback(
    (roles = []) => roles.some((role) => authState.user?.roles.includes(role)),
    [authState.user],
  );
  const value = useMemo(
    () => ({
      ...authState,
      isChecking: authState.status === "CHECKING",
      setSession,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [authState, setSession, logout, hasRole, hasAnyRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
