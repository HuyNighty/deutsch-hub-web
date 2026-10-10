import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import { getFieldMessage } from "@/shared/api/api-error";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { useAuth } from "@/features/auth/context/AuthProvider";
import useDeactivateAccount from "../hooks/useDeactivateAccount";
import { accountErrorMessage } from "../account-error-presentation";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);

function DeactivationConfirmation() {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [validation, setValidation] = useState(null);
  const { confirm, isPending, competingPending, error, reset } = useDeactivateAccount();
  const passwordError = getFieldMessage(error, "password");

  function close() {
    setConfirming(false);
    setPassword("");
    setAcknowledged(false);
    setValidation(null);
    reset();
  }

  function submit(event) {
    event.preventDefault();
    if (isPending || competingPending) return;
    if (!password.trim() || !acknowledged) {
      setValidation("Nhập mật khẩu hiện tại và xác nhận bạn hiểu hậu quả của việc vô hiệu hóa tài khoản.");
      return;
    }
    setValidation(null);
    if (confirm(password, acknowledged)) setPassword("");
  }

  return (
    <section lang="vi" className={cx("content")} aria-labelledby="account-deactivation-heading">
      <div className={cx("card")}>
        <div className={cx("item")}>
          <h2 id="account-deactivation-heading" className={cx("security-title")}>Vô hiệu hóa tài khoản</h2>
          <p>Tài khoản của bạn sẽ bị vô hiệu hóa. Bạn sẽ không thể đăng nhập khi tài khoản chưa được kích hoạt lại.</p>
          <p>Tất cả phiên đăng nhập sẽ bị thu hồi. Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn.</p>
          <p>Thao tác này không xóa dữ liệu tài khoản của bạn. Bạn không thể kích hoạt lại tài khoản qua màn hình này.</p>
          {validation && <p role="alert" className={cx("field-error")}>{validation}</p>}
          {error && <p role="alert" className={cx("field-error")}>
            {error.status == null ? "Không thể xác nhận tài khoản của bạn đã được vô hiệu hóa hay chưa. Hãy đăng xuất khỏi phiên hiện tại. Bạn có thể không đăng nhập lại được nếu tài khoản đã bị vô hiệu hóa." : accountErrorMessage(error, "deactivation")}
          </p>}
          {confirming ? (
            <form lang="vi" aria-label="Vô hiệu hóa tài khoản" onSubmit={submit} noValidate>
              <div className={cx("field")}>
                <label htmlFor="deactivation-password">Mật khẩu hiện tại</label>
                <input id="deactivation-password" name="password" type="password" autoComplete="current-password"
                  value={password} disabled={isPending || competingPending} aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "deactivation-password-error" : undefined}
                  onChange={(event) => { setPassword(event.target.value); setValidation(null); reset(); }} />
                {passwordError && <p id="deactivation-password-error" className={cx("field-error")}>{passwordError}</p>}
              </div>
              <label>
                <input type="checkbox" checked={acknowledged} disabled={isPending || competingPending}
                  onChange={(event) => { setAcknowledged(event.target.checked); setValidation(null); }} />
                Tôi hiểu hậu quả của việc vô hiệu hóa tài khoản của mình.
              </label>
              <div className={cx("actions")}>
                <Button type="submit" loading={isPending} disabled={competingPending || !password.trim() || !acknowledged}>
                  {isPending ? "Đang vô hiệu hóa…" : "Xác nhận vô hiệu hóa"}
                </Button>
                <Button variant="outline" disabled={isPending} onClick={close}>Hủy vô hiệu hóa</Button>
              </div>
            </form>
          ) : <Button variant="outline" disabled={isPending || competingPending} onClick={() => { reset(); setConfirming(true); }}>Vô hiệu hóa tài khoản</Button>}
        </div>
      </div>
    </section>
  );
}

export default function AccountDeactivation() {
  useAuth();
  // Remount confirmation state even when a new session has the same subject.
  return <DeactivationConfirmation key={getSessionGeneration()} />;
}
