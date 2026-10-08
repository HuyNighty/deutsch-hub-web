import { useState } from "react";
import classNames from "classnames/bind";
import { ApiError, getFieldMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/components/button";
import useChangePassword from "../hooks/useChangePassword";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);
const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  { name: "verifyNewPassword", label: "Confirm new password", autoComplete: "new-password" },
];

export default function PasswordForm({ onCancel }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", verifyNewPassword: "" });
  const [validationError, setValidationError] = useState(null);
  const { submit, isPending, error: updateError, reset } = useChangePassword();
  const error = validationError ?? updateError;

  function onSubmit(event) {
    event.preventDefault();
    if (isPending) return;
    const errors = fields.filter(({ name }) => !form[name].trim())
      .map(({ name, label }) => ({ field: name, message: `${label} must not be blank.` }));
    if (form.newPassword.trim() && (form.newPassword.length < 8 || form.newPassword.length > 100)) {
      errors.push({ field: "newPassword", message: "New password must be between 8 and 100 characters." });
    }
    if (form.verifyNewPassword.trim() && form.verifyNewPassword !== form.newPassword) {
      errors.push({ field: "verifyNewPassword", message: "Password confirmation must match the new password." });
    }
    if (errors.length) {
      setValidationError(new ApiError({ message: "Please check your password information.", errors }));
      return;
    }
    setValidationError(null);
    submit(form);
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Change password" className={cx("password-form")}>
      {error && <p role="alert" className={cx("field-error")}>{error.message}</p>}
      {fields.map(({ name, label, autoComplete }) => {
        const fieldError = getFieldMessage(error, name);
        return (
          <div key={name} className={cx("field")}>
            <label htmlFor={`password-${name}`}>{label}</label>
            <input
              id={`password-${name}`} name={name} type="password" autoComplete={autoComplete}
              value={form[name]} disabled={isPending}
              aria-invalid={!!fieldError} aria-describedby={fieldError ? `password-${name}-error` : undefined}
              onChange={(event) => {
                setForm((current) => ({ ...current, [name]: event.target.value }));
                setValidationError(null);
                reset();
              }}
            />
            {fieldError && <p id={`password-${name}-error`} className={cx("field-error")}>{fieldError}</p>}
          </div>
        );
      })}
      <div className={cx("actions")}>
        <Button type="submit" loading={isPending}>{isPending ? "Changing password…" : "Change Password"}</Button>
        <Button variant="outline" disabled={isPending} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
