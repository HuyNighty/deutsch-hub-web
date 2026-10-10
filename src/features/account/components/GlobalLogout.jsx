import { useState } from "react";
import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import useGlobalLogout from "../hooks/useGlobalLogout";
import { accountErrorMessage } from "../account-error-presentation";
import styles from "../Account.module.scss";

const cx = classNames.bind(styles);

export default function GlobalLogout() {
  const [confirming, setConfirming] = useState(false);
  const { confirm, isPending, competingPending, error, reset } = useGlobalLogout();
  return (
    <div lang="vi" className={cx("item")}>
      <h3>Đăng xuất trên tất cả thiết bị</h3>
      <p>Thu hồi tất cả phiên đăng nhập, bao gồm phiên hiện tại. Bạn sẽ cần đăng nhập lại.</p>
      <p>Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn.</p>
      {error && <p role="alert" className={cx("field-error")}>
        {error.status == null ? "Không thể xác nhận tất cả phiên đăng nhập đã được thu hồi hay chưa. Hãy đăng xuất khỏi phiên hiện tại rồi đăng nhập lại." : accountErrorMessage(error, "globalLogout")}
      </p>}
      {confirming ? (
        <form lang="vi" aria-label="Đăng xuất trên tất cả thiết bị" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
          <p>Xác nhận đăng xuất trên tất cả thiết bị?</p>
          <div className={cx("actions")}>
            <Button type="submit" loading={isPending} disabled={competingPending}>{isPending ? "Đang đăng xuất…" : "Xác nhận"}</Button>
            <Button variant="outline" disabled={isPending} onClick={() => { setConfirming(false); reset(); }}>Hủy</Button>
          </div>
        </form>
      ) : <Button variant="outline" disabled={isPending || competingPending} onClick={() => { reset(); setConfirming(true); }}>Đăng xuất trên tất cả thiết bị</Button>}
    </div>
  );
}
