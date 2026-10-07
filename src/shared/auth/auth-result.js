import { decodeJwtPayload } from "./jwt";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;
const isExpiry = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function anonymousAuthState(status = "ANONYMOUS") {
  return { status, accessToken: null, user: null, isAuthenticated: false };
}

export function buildAuthState(accessToken) {
  const payload = decodeJwtPayload(accessToken);
  if (
    !isNonblank(accessToken) ||
    !isObject(payload) ||
    !isNonblank(payload.sub) ||
    !Array.isArray(payload.roles) ||
    !payload.roles.every(isNonblank) ||
    !isExpiry(payload.exp) ||
    payload.exp * 1000 <= Date.now()
  ) return anonymousAuthState();

  return {
    status: "AUTHENTICATED",
    accessToken,
    user: { id: payload.sub, roles: payload.roles },
    isAuthenticated: true,
  };
}

function validateTokens(result, expiryField) {
  if (
    !isObject(result) ||
    !isNonblank(result.accessToken) ||
    !isNonblank(result.refreshToken) ||
    !isExpiry(result[expiryField])
  ) throw new Error("Invalid authentication response");

  const state = buildAuthState(result.accessToken);
  if (!state.isAuthenticated) throw new Error("Invalid authentication access token");
  return state;
}

export function validateLoginResult(result) {
  const state = validateTokens(result, "accessTokenExpiresIn");
  const user = result.user;
  if (
    !isObject(user) ||
    !isNonblank(user.id) ||
    !isNonblank(user.username) ||
    !isNonblank(user.email) ||
    typeof user.fullName !== "string" ||
    !(user.phoneNumber == null || typeof user.phoneNumber === "string") ||
    user.id !== state.user.id
  ) throw new Error("Invalid login user response");
  return state;
}

export function validateRefreshResult(result) {
  return validateTokens(result, "expiresIn");
}
