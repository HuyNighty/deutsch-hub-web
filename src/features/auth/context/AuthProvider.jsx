import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { decodeJwtPayload } from "@/shared/auth/jwt";
import {
  clearTokens,
  getAccessToken,
  saveAccessToken,
  saveRefreshToken,
} from "@/shared/auth/token";

import { registerSessionUpdater } from "@/shared/auth/auth-session";

const AuthContext = createContext(null);

function buildAuthState(accessToken) {
  const payload = decodeJwtPayload(accessToken);

  const isAuthenticated =
    !!accessToken &&
    !!payload &&
    typeof payload.exp === "number" &&
    payload.exp * 1000 > Date.now();

  const user =
    isAuthenticated && payload?.sub
      ? {
          id: payload.sub,
          roles: Array.isArray(payload.roles) ? payload.roles : [],
        }
      : null;

  return {
    accessToken: isAuthenticated ? accessToken : null,
    user,
    isAuthenticated,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() =>
    buildAuthState(getAccessToken()),
  );

  const setSession = useCallback((session) => {
    saveAccessToken(session.accessToken);

    if (session.refreshToken) {
      saveRefreshToken(session.refreshToken);
    }

    setAuthState(buildAuthState(session.accessToken));
  }, []);

  useEffect(() => {
    registerSessionUpdater(setSession);
  }, [setSession]);

  const logout = useCallback(() => {
    clearTokens();

    setAuthState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  }, []);

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

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
