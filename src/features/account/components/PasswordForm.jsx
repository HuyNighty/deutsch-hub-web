import { useState } from "react";
import classNames from "classnames/bind";
import { ApiError, getFieldMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/components/button";
import useChangePassword from "../hooks/useChangePassword";
import { accountErrorMessage } from "../account-error-presentation";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);
const fields = [
  { name: "currentPassword", label: "Mật khẩu hiện tại", autoComplete: "current-password" },
  { name: "newPassword", label: "Mật khẩu mới", autoComplete: "new-password" },
  { name: "verifyNewPassword", label: "Xác nhận mật khẩu mới", autoComplete: "new-password" },
];

export default function PasswordForm({ onCancel, disabled = false }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", verifyNewPassword: "" });
  const [validationError, setValidationError] = useState(null);
  const { submit, isPending, error: updateError, reset } = useChangePassword();
  const error = validationError ?? updateError;
  const uncertain = !validationError && updateError && updateError.status == null;

  function onSubmit(event) {
    event.preventDefault();
    if (isPending || disabled) return;
    const errors = fields.filter(({ name }) => !form[name].trim())
      .map(({ name, label }) => ({ field: name, message: `${label} không được để trống.` }));
    if (form.newPassword.trim() && (form.newPassword.length < 8 || form.newPassword.length > 100)) {
      errors.push({ field: "newPassword", message: "Mật khẩu mới phải có từ 8 đến 100 ký tự." });
    }
    if (form.verifyNewPassword.trim() && form.verifyNewPassword !== form.newPassword) {
      errors.push({ field: "verifyNewPassword", message: "Mật khẩu xác nhận phải khớp với mật khẩu mới." });
    }
    if (errors.length) {
      setValidationError(new ApiError({ message: "Vui lòng kiểm tra thông tin mật khẩu.", errors }));
      return;
    }
    setValidationError(null);
    submit(form);
  }

  return (
    <form lang="vi" onSubmit={onSubmit} noValidate aria-label="Đổi mật khẩu" className={cx("password-form")}>
      {error && <p role="alert" className={cx("field-error")}>
        {uncertain ? "Không thể xác nhận mật khẩu của bạn đã được thay đổi hay chưa. Cách khôi phục an toàn là đăng xuất khỏi phiên hiện tại, sau đó đăng nhập lại." : validationError ? validationError.message : accountErrorMessage(error, "password")}
      </p>}
      {fields.map(({ name, label, autoComplete }) => {
        const fieldError = getFieldMessage(error, name);
        return (
          <div key={name} className={cx("field")}>
            <label htmlFor={`password-${name}`}>{label}</label>
            <input
              id={`password-${name}`} name={name} type="password" autoComplete={autoComplete}
              value={form[name]} disabled={isPending || disabled}
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
        <Button type="submit" loading={isPending} disabled={disabled}>{isPending ? "Đang đổi mật khẩu…" : "Đổi mật khẩu"}</Button>
        <Button variant="outline" disabled={isPending || disabled} onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  );
}
