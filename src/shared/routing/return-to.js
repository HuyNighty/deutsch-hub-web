export function safeReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") ||
      value.startsWith("//") || value.includes("\\") ||
      Array.from(value).some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) {
    return "/account";
  }
  return value;
}
