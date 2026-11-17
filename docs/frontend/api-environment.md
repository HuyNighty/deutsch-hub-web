# DeutschHub frontend — API endpoint by environment (R3.5-H12)

## Scope

All three Axios clients in `src/shared/api/axios.js` use the same backend **root**:

- Public/private V1 requests: `<root>/api/v1`
- V2 requests: `<root>/api/v2`
- Token refresh: `<root>/api/v1/auth/refresh`

`VITE_API_BASE_URL` names the origin **including the deployed Spring context path**, but **without** `/api/v1` or `/api/v2`.

## Local development

No variable is required for `npm run dev`: the existing default remains
`http://localhost:8080/deutsch-hub` (with V1/V2 suffixes appended automatically).
To override a local port, use an untracked `.env.local` file:

```dotenv
VITE_API_BASE_URL=http://localhost:9000/deutsch-hub
```

## Production / preview bundles

A production build **requires** `VITE_API_BASE_URL`; a missing or unsafe value causes
`vite build` to **fail before bundling**, rather than silently targeting the
visitor's localhost.

Choose **one** public routing architecture:

1. Separate backend HTTPS origin, e.g. `https://api.example.org/deutsch-hub`.
   Configure Spring CORS for the actual frontend origin and verify that the
   public HTTPS certificate and context path are valid.
2. Same-origin reverse proxy, e.g. `/deutsch-hub`. Your edge server must
   route `/deutsch-hub/api/v1/**` and `/deutsch-hub/api/v2/**` to the backend.
   `/deutsch-hub` is an **illustration only** and does not configure a proxy.

For example, set `VITE_API_BASE_URL` as a public build environment variable
in the actual deployment service, then run `npm ci && npm run build`.
No real production hostname or routing service has been selected by this PR.

**Production guardrails**

- HTTPS origins or root-relative same-origin paths only. HTTP URLs, loopback
  hosts, query strings, fragments, URL user/password and already-appended
  `/api/v1` or `/api/v2` are rejected.
- **Never** use `VITE_` for passwords, tokens, API keys or private backend secrets.
  Vite inlines public `VITE_` variables into the built browser JavaScript.
- These values are **build-time** configuration, not runtime variables: update
  the deployed value and rebuild to change origins. No backend credentials
  are added, issued, transmitted or stored by H12.
- Keep untracked `.env` and mode-specific `.env.*` files private. Only the
  commented `.env.example` is tracked.
- The FE PR-validation workflow compiles with `/deutsch-hub` as a **mock
  same-origin routing example**. It does **not** prove any production proxy exists.

## How to validate

- `npm run dev`: V1/V2/refresh continue to use the local backend.
- `npm run test -- --maxWorkers=2`: API root helper tests and existing
  authentication/feature tests.
- `npm run build` without `VITE_API_BASE_URL`: **expected failure** in
  the production gate.
- `VITE_API_BASE_URL=http://localhost:8080/deutsch-hub npm run build`:
  **expected failure** (unsafe production origin).
- `VITE_API_BASE_URL=/deutsch-hub npm run build`: **expected success**
  for validation only; an actual deployed proxy must be checked separately.

H12 does not verify remote CORS, TLS, proxy configuration or a deployed frontend
to a live backend; those remain deployment and integrated-acceptance gates.
