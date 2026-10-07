import { ApiError } from "@/shared/api/api-error";

const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;

export function parseAccount(value) {
  const valid = value !== null && typeof value === "object" && !Array.isArray(value) &&
    ["id", "username", "email", "firstName", "lastName", "fullName"].every((field) => isNonblank(value[field])) &&
    (value.phoneNumber === null || typeof value.phoneNumber === "string");
  if (!valid) throw new ApiError({ message: "The server returned an invalid account response." });
  return value;
}
