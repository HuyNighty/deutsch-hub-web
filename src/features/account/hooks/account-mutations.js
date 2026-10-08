export const deactivationMutationKey = ["account", "deactivate"];

export const competesWithDeactivation = ({ options: { mutationKey: key } }) =>
  Array.isArray(key) && key[0] === "account" && (
    (key.length === 2 && ["update-profile", "change-password", "logout-all"].includes(key[1])) ||
    (key.length === 3 && key[1] === "sessions" && key[2] === "revoke")
  );
