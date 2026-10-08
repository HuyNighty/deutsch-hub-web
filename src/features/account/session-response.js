import { ApiError } from "@/shared/api/api-error";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isLocalDateTime(value) {
  if (typeof value !== "string") return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/.exec(value);
  if (!parts) return false;
  const [, year, month, day, hour, minute, second] = parts.map((part) => Number(part ?? 0));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] &&
    hour <= 23 && minute <= 59 && second <= 59;
}

export function parseSessions(value) {
  const valid = Array.isArray(value) && value.every((row) =>
    row !== null && typeof row === "object" && !Array.isArray(row) &&
    typeof row.id === "string" && uuid.test(row.id) &&
    isLocalDateTime(row.createdAt) && isLocalDateTime(row.expiresAt) &&
    (row.revokedAt === null || isLocalDateTime(row.revokedAt)) &&
    typeof row.active === "boolean" && typeof row.current === "boolean",
  );
  if (!valid) throw new ApiError({ message: "The server returned an invalid login sessions response." });
  return value;
}
