import { useState } from "react";
import classNames from "classnames/bind";
import { ApiError, getFieldMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/components/button";
import useUpdateProfile from "../hooks/useUpdateProfile";
import { accountErrorMessage } from "../account-error-presentation";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);
const fields = [
  { name: "firstName", label: "Tên", max: 50, autoComplete: "given-name" },
  { name: "lastName", label: "Họ", max: 50, autoComplete: "family-name" },
  { name: "phoneNumber", label: "Số điện thoại", max: 20, autoComplete: "tel" },
];

export default function ProfileForm({ account, onCancel, onSaved, disabled = false }) {
  const [form, setForm] = useState(() => ({
    firstName: account.firstName,
    lastName: account.lastName,
    phoneNumber: account.phoneNumber ?? "",
  }));
  const [validationError, setValidationError] = useState(null);
  const { save, isPending, error: updateError, reset } = useUpdateProfile();
  const error = validationError ?? updateError;

  function onSubmit(event) {
    event.preventDefault();
    if (isPending || disabled) return;
    const errors = fields.flatMap(({ name, label, max }) => {
      if (name !== "phoneNumber" && !form[name].trim()) {
        return [{ field: name, message: `${label} không được để trống.` }];
      }
      return form[name].length > max ? [{ field: name, message: `${label} không được vượt quá ${max} ký tự.` }] : [];
    });
    if (errors.length) {
      setValidationError(new ApiError({ message: "Vui lòng kiểm tra thông tin hồ sơ.", errors }));
      return;
    }
    setValidationError(null);
    save(form, onSaved);
  }

  return (
    <form lang="vi" onSubmit={onSubmit} noValidate aria-label="Chỉnh sửa hồ sơ" className={cx("profile-form")}>
      {error && <p role="alert" className={cx("field-error")}>{validationError ? validationError.message : accountErrorMessage(error, "profile")}</p>}
      {fields.map(({ name, label, max, autoComplete }) => {
        const fieldError = getFieldMessage(error, name);
        return (
          <div key={name} className={cx("field")}>
            <label htmlFor={`profile-${name}`}>{label}</label>
            <input
              id={`profile-${name}`} name={name} type={name === "phoneNumber" ? "tel" : "text"}
              autoComplete={autoComplete} maxLength={max} value={form[name]} disabled={isPending || disabled}
              aria-invalid={!!fieldError} aria-describedby={fieldError ? `profile-${name}-error` : undefined}
              onChange={(event) => {
                setForm((current) => ({ ...current, [name]: event.target.value }));
                setValidationError(null);
                reset();
              }}
            />
            {fieldError && <p id={`profile-${name}-error`} className={cx("field-error")}>{fieldError}</p>}
          </div>
        );
      })}
      <div className={cx("actions")}>
        <Button type="submit" loading={isPending} disabled={disabled}>{isPending ? "Đang lưu…" : "Lưu"}</Button>
        <Button variant="outline" disabled={isPending || disabled} onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  );
}
