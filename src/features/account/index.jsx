import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import ResourceState from "@/shared/ui/state/ResourceState";
import LogoutButton from "@/features/auth/login/components/LogoutButton";
import { Button } from "@/shared/ui/components/button";
import ProfileForm from "./components/ProfileForm";
import PasswordForm from "./components/PasswordForm";
import SessionsSection from "./components/SessionsSection";
import GlobalLogout from "./components/GlobalLogout";
import { globalLogoutMutationKey } from "./hooks/useGlobalLogout";

import useAccount from "./hooks/useAccount";

import classNames from "classnames/bind";
import styles from "./Account.module.scss";

const cx = classNames.bind(styles);

function Account() {
  const { account, loading, error, refetch } = useAccount();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const globalLogoutPending = useIsMutating({ mutationKey: globalLogoutMutationKey, exact: true }) > 0;

  const { username, firstName, lastName, fullName, email, phoneNumber } = account ?? {};

  return (
    <ResourceState loading={loading} error={error} onRetry={refetch}>
      <main className={cx("page")}>
        <header className={cx("header")}>
          <h1 className={cx("title")}>My Account</h1>

          <p className={cx("description")}>Manage your account information.</p>
          <LogoutButton />
        </header>

        <section className={cx("content")}>
          <div className={cx("card")}>
            <div className={cx("item")}>
              <span className={cx("label")}>Username (read-only)</span>

              <span className={cx("value")}>{username}</span>
            </div>

            <div className={cx("item")}>
              <span className={cx("label")}>Full Name</span>

              <span className={cx("value")}>{fullName}</span>
            </div>

            <div className={cx("item")}>
              <span className={cx("label")}>Email (read-only)</span>

              <span className={cx("value")}>{email}</span>
            </div>

            {editing ? (
              <ProfileForm account={account} onCancel={() => setEditing(false)} onSaved={() => {
                setEditing(false);
                setSaved(true);
              }} />
            ) : (
              <>
                <div className={cx("item")}>
                  <span className={cx("label")}>First name</span>
                  <span className={cx("value")}>{firstName}</span>
                </div>
                <div className={cx("item")}>
                  <span className={cx("label")}>Last name</span>
                  <span className={cx("value")}>{lastName}</span>
                </div>
                <div className={cx("item")}>
                  <span className={cx("label")}>Phone number</span>
                  <span className={cx("value")}>{phoneNumber || "-"}</span>
                </div>
                <div className={cx("item")}>
                  {saved && <p role="status">Profile saved.</p>}
                  <Button onClick={() => { setSaved(false); setEditing(true); }}>Edit Profile</Button>
                </div>
              </>
            )}
          </div>
        </section>
        <section className={cx("content")} aria-labelledby="account-security-heading">
          <div className={cx("card")}>
            <div className={cx("item")}>
              <h2 id="account-security-heading" className={cx("security-title")}>Security</h2>
              <p>Manage your password.</p>
            </div>
            {changingPassword ? (
              <PasswordForm disabled={globalLogoutPending} onCancel={() => setChangingPassword(false)} />
            ) : (
              <div className={cx("item")}>
                <Button disabled={globalLogoutPending} onClick={() => setChangingPassword(true)}>Change Password</Button>
              </div>
            )}
            <GlobalLogout />
          </div>
        </section>
        <SessionsSection actionsDisabled={globalLogoutPending} />
      </main>
    </ResourceState>
  );
}

export default Account;
