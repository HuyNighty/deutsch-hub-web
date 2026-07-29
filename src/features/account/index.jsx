import ResourceState from "@/shared/ui/state/ResourceState";

import useAccount from "./hooks/useAccount";

import classNames from "classnames/bind";
import styles from "./Account.module.scss";

const cx = classNames.bind(styles);

function Account() {
  const { account, loading, error, refetch } = useAccount();

  const { username, fullName, email, phoneNumber } = account ?? {};

  return (
    <ResourceState loading={loading} error={error} onRetry={refetch}>
      <main className={cx("page")}>
        <header className={cx("header")}>
          <h1 className={cx("title")}>My Account</h1>

          <p className={cx("description")}>Manage your account information.</p>
        </header>

        <section className={cx("content")}>
          <div className={cx("card")}>
            <div className={cx("item")}>
              <span className={cx("label")}>Username</span>

              <span className={cx("value")}>{username}</span>
            </div>

            <div className={cx("item")}>
              <span className={cx("label")}>Full Name</span>

              <span className={cx("value")}>{fullName}</span>
            </div>

            <div className={cx("item")}>
              <span className={cx("label")}>Email</span>

              <span className={cx("value")}>{email}</span>
            </div>

            <div className={cx("item")}>
              <span className={cx("label")}>Phone Number</span>

              <span className={cx("value")}>{phoneNumber || "-"}</span>
            </div>
          </div>
        </section>
      </main>
    </ResourceState>
  );
}

export default Account;
