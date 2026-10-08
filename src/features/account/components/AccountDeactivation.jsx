import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import { getFieldMessage } from "@/shared/api/api-error";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { useAuth } from "@/features/auth/context/AuthProvider";
import useDeactivateAccount from "../hooks/useDeactivateAccount";
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
      setValidation("Enter your current password and acknowledge the consequences.");
      return;
    }
    setValidation(null);
    if (confirm(password, acknowledged)) setPassword("");
  }

  return (
    <section className={cx("content")} aria-labelledby="account-deactivation-heading">
      <div className={cx("card")}>
        <div className={cx("item")}>
          <h2 id="account-deactivation-heading" className={cx("security-title")}>Account Deactivation</h2>
          <p>Your account will be deactivated. You will no longer be able to sign in while it is inactive.</p>
          <p>All login sessions will be revoked. Existing access tokens may remain valid until they expire.</p>
          <p>This action does not delete your account data. You cannot reactivate your account through this screen.</p>
          {validation && <p role="alert" className={cx("field-error")}>{validation}</p>}
          {error && <p role="alert" className={cx("field-error")}>
            {error.status == null ? "We couldn't confirm whether your account was deactivated. Use Logout to end this local session. Signing in again may be unavailable if the account is inactive." : error.message}
          </p>}
          {confirming ? (
            <form aria-label="Deactivate account" onSubmit={submit} noValidate>
              <div className={cx("field")}>
                <label htmlFor="deactivation-password">Current password</label>
                <input id="deactivation-password" name="password" type="password" autoComplete="current-password"
                  value={password} disabled={isPending || competingPending} aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "deactivation-password-error" : undefined}
                  onChange={(event) => { setPassword(event.target.value); setValidation(null); reset(); }} />
                {passwordError && <p id="deactivation-password-error" className={cx("field-error")}>{passwordError}</p>}
              </div>
              <label>
                <input type="checkbox" checked={acknowledged} disabled={isPending || competingPending}
                  onChange={(event) => { setAcknowledged(event.target.checked); setValidation(null); }} />
                I understand the consequences of deactivating my account.
              </label>
              <div className={cx("actions")}>
                <Button type="submit" loading={isPending} disabled={competingPending || !password.trim() || !acknowledged}>
                  {isPending ? "Deactivating…" : "Confirm deactivation"}
                </Button>
                <Button variant="outline" disabled={isPending} onClick={close}>Cancel deactivation</Button>
              </div>
            </form>
          ) : <Button variant="outline" disabled={isPending || competingPending} onClick={() => { reset(); setConfirming(true); }}>Deactivate account</Button>}
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
