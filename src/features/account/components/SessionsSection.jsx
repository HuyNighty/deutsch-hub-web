import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import useSessions from "../hooks/useSessions";
import useRevokeSession from "../hooks/useRevokeSession";
import { accountErrorMessage } from "../account-error-presentation";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);
const localTime = (value) => <time dateTime={value}>{value.replace("T", " ")}</time>;

export default function SessionsSection({ actionsDisabled = false }) {
  const { sessions, loading, error, refetch } = useSessions();
  const { revoke, isPending, error: revokeError, success, reset } = useRevokeSession();
  const [selected, setSelected] = useState(null);

  return (
    <section lang="vi" className={cx("content")} aria-labelledby="account-sessions-heading">
      <div className={cx("card")}>
        <div className={cx("item")}>
          <h2 id="account-sessions-heading" className={cx("security-title")}>Phiên đăng nhập</h2>
          <p>Việc thu hồi phiên đăng nhập ngăn phiên đó tiếp tục làm mới token. Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn.</p>
          {success && <p role="status">{success}</p>}
          {revokeError && <p role="alert" className={cx("field-error")}>{accountErrorMessage(revokeError, "revoke")}</p>}
        </div>
        {loading ? <p className={cx("item")} role="status">Đang tải phiên đăng nhập…</p> : error ? (
          <div className={cx("item")}>
            <p role="alert" className={cx("field-error")}>{accountErrorMessage(error, "sessions")}</p>
            <Button variant="outline" disabled={isPending} onClick={() => refetch()}>Tải lại phiên đăng nhập</Button>
          </div>
        ) : sessions.length === 0 ? <p className={cx("item")}>Không tìm thấy phiên đăng nhập nào.</p> : (
          <ol className={cx("session-list")}>
            {sessions.map((session) => (
              <li key={session.id} className={cx("item")} aria-label={`Phiên đăng nhập ${session.id}`}>
                <h3 className={cx("session-id")}>Phiên đăng nhập {session.id}</h3>
                <p>{session.active ? "Đang hoạt động" : "Không hoạt động"}</p>
                {session.current && <p>Phiên hiện tại</p>}
                <dl className={cx("session-times")}>
                  <dt>Tạo lúc</dt><dd>{localTime(session.createdAt)}</dd>
                  <dt>Hết hạn lúc</dt><dd>{localTime(session.expiresAt)}</dd>
                  {session.revokedAt !== null && <><dt>Thu hồi lúc</dt><dd>{localTime(session.revokedAt)}</dd></>}
                </dl>
                {session.active && (selected === session.id ? (
                  <form lang="vi" aria-label="Thu hồi phiên đăng nhập" onSubmit={(event) => {
                    event.preventDefault();
                    if (!isPending && !actionsDisabled) revoke(session, () => setSelected(null));
                  }}>
                    <p>{session.current ? "Thu hồi phiên đăng nhập hiện tại của bạn? Bạn sẽ cần đăng nhập lại." : "Thu hồi phiên đăng nhập này?"}</p>
                    <div className={cx("actions")}>
                      <Button type="submit" loading={isPending} disabled={actionsDisabled}>{isPending ? "Đang thu hồi…" : "Xác nhận thu hồi"}</Button>
                      <Button variant="outline" disabled={isPending || actionsDisabled} onClick={() => { setSelected(null); reset(); }}>Hủy thu hồi</Button>
                    </div>
                  </form>
                ) : <Button variant="outline" disabled={isPending || actionsDisabled} onClick={() => { reset(); setSelected(session.id); }}>Thu hồi phiên đăng nhập</Button>)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
