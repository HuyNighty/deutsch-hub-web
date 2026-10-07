import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthProvider";
import { saveAccessToken, saveRefreshToken } from "@/shared/auth/token";

let tokenSequence = 0;

export function token(id = "learner-a", exp = Math.floor(Date.now() / 1000) + 3600) {
  tokenSequence += 1;
  return `header.${btoa(JSON.stringify({ sub: id, roles: ["LEARNER"], exp, jti: tokenSequence }))}.signature`;
}

export function loginResult(id = "learner-b") {
  return {
    accessToken: token(id),
    refreshToken: `refresh-${id}`,
    accessTokenExpiresIn: 3600,
    user: { id, username: id, email: `${id}@example.com`, fullName: "Learner Name", phoneNumber: null },
  };
}

export function refreshResult(id = "learner-a") {
  return { accessToken: token(id), refreshToken: `rotated-${id}`, expiresIn: 3600 };
}

export function seedSession({ expired = false, id = "learner-a", access = true } = {}) {
  if (access) saveAccessToken(token(id, Math.floor(Date.now() / 1000) + (expired ? -60 : 3600)));
  saveRefreshToken(`original-${id}`);
}

export function mountSession(routes = [{ path: "/", element: <div>Home</div> }], {
  path = "/", state, client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity }, mutations: { retry: false },
  } }), strict = true,
} = {}) {
  const observed = { current: null };
  const observations = [];
  function Probe() {
    observed.current = useAuth();
    observations.push({ status: observed.current.status, cache: client.getQueryData(["sentinel"]) });
    return <output data-testid="auth">{observed.current.status}:{observed.current.user?.id}</output>;
  }
  const router = createMemoryRouter(routes, { initialEntries: [{ pathname: path.split(/[?#]/)[0],
    search: path.includes("?") ? path.slice(path.indexOf("?")).split("#")[0] : "",
    hash: path.includes("#") ? path.slice(path.indexOf("#")) : "", state }] });
  const app = <QueryClientProvider client={client}><AuthProvider>
    <Probe /><RouterProvider router={router} />
  </AuthProvider></QueryClientProvider>;
  const view = render(strict ? <StrictMode>{app}</StrictMode> : app);
  return { ...view, router, client, auth: observed, observations };
}
