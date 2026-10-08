import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import useGlobalLogout from "../hooks/useGlobalLogout";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);

export default function GlobalLogout() {
  const [confirming, setConfirming] = useState(false);
  const { confirm, isPending, competingPending, error, reset } = useGlobalLogout();
  return (
    <div className={cx("item")}>
      <h3>Sign out everywhere</h3>
      <p>Revoke all login sessions, including this one. You will need to sign in again.</p>
      <p>Existing access tokens may remain valid until they expire.</p>
      {error && <p role="alert" className={cx("field-error")}>
        {error.status == null ? "We couldn't confirm whether all login sessions were revoked. Use Logout to end this local session, then sign in again." : error.message}
      </p>}
      {confirming ? (
        <form aria-label="Sign out everywhere" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
          <p>Confirm signing out everywhere?</p>
          <div className={cx("actions")}>
            <Button type="submit" loading={isPending} disabled={competingPending}>{isPending ? "Signing out…" : "Confirm"}</Button>
            <Button variant="outline" disabled={isPending} onClick={() => { setConfirming(false); reset(); }}>Cancel</Button>
          </div>
        </form>
      ) : <Button variant="outline" disabled={isPending || competingPending} onClick={() => { reset(); setConfirming(true); }}>Sign out everywhere</Button>}
    </div>
  );
}
