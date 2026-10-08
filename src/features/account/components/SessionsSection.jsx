import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import useSessions from "../hooks/useSessions";
import useRevokeSession from "../hooks/useRevokeSession";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);
const localTime = (value) => <time dateTime={value}>{value.replace("T", " ")}</time>;

export default function SessionsSection({ actionsDisabled = false }) {
  const { sessions, loading, error, refetch } = useSessions();
  const { revoke, isPending, error: revokeError, success, reset } = useRevokeSession();
  const [selected, setSelected] = useState(null);

  return (
    <section className={cx("content")} aria-labelledby="account-sessions-heading">
      <div className={cx("card")}>
        <div className={cx("item")}>
          <h2 id="account-sessions-heading" className={cx("security-title")}>Login sessions</h2>
          <p>Revoking a session prevents future refreshes. Existing access tokens may remain valid until they expire.</p>
          {success && <p role="status">{success}</p>}
          {revokeError && <p role="alert" className={cx("field-error")}>{revokeError.message}</p>}
        </div>
        {loading ? <p className={cx("item")} role="status">Loading login sessions…</p> : error ? (
          <div className={cx("item")}>
            <p role="alert" className={cx("field-error")}>{error.message}</p>
            <Button variant="outline" disabled={isPending} onClick={() => refetch()}>Retry sessions</Button>
          </div>
        ) : sessions.length === 0 ? <p className={cx("item")}>No login sessions found.</p> : (
          <ol className={cx("session-list")}>
            {sessions.map((session) => (
              <li key={session.id} className={cx("item")} aria-label={`Session ${session.id}`}>
                <h3 className={cx("session-id")}>Session {session.id}</h3>
                <p>{session.active ? "Active" : "Inactive"}</p>
                {session.current && <p>Current session</p>}
                <dl className={cx("session-times")}>
                  <dt>Created</dt><dd>{localTime(session.createdAt)}</dd>
                  <dt>Expires</dt><dd>{localTime(session.expiresAt)}</dd>
                  {session.revokedAt !== null && <><dt>Revoked</dt><dd>{localTime(session.revokedAt)}</dd></>}
                </dl>
                {session.active && (selected === session.id ? (
                  <form aria-label="Revoke session" onSubmit={(event) => {
                    event.preventDefault();
                    if (!isPending && !actionsDisabled) revoke(session, () => setSelected(null));
                  }}>
                    <p>{session.current ? "Revoke your current login session? You will need to sign in again." : "Revoke this login session?"}</p>
                    <div className={cx("actions")}>
                      <Button type="submit" loading={isPending} disabled={actionsDisabled}>{isPending ? "Revoking…" : "Confirm revoke"}</Button>
                      <Button variant="outline" disabled={isPending || actionsDisabled} onClick={() => { setSelected(null); reset(); }}>Cancel revoke</Button>
                    </div>
                  </form>
                ) : <Button variant="outline" disabled={isPending || actionsDisabled} onClick={() => { reset(); setSelected(session.id); }}>Revoke session</Button>)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
