export const otherSession = {
  id: "11111111-1111-4111-8111-111111111111",
  createdAt: "2026-10-08T10:00:00",
  expiresAt: "2026-10-15T10:00:00",
  revokedAt: null,
  active: true,
  current: false,
};
export const currentSession = {
  ...otherSession,
  id: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-10-07T09:30:00.123456789",
  current: true,
};
export const revokedSession = {
  ...otherSession,
  id: "33333333-3333-4333-8333-333333333333",
  createdAt: "2026-09-25T11:15:00",
  revokedAt: "2026-09-26T12:30:00",
  active: false,
};
export const expiredSession = {
  ...otherSession,
  id: "44444444-4444-4444-8444-444444444444",
  createdAt: "2026-09-23T10:00:00",
  expiresAt: "2026-09-30T10:00:00",
  active: false,
};
export const sessionRows = [otherSession, revokedSession, currentSession, expiredSession];
