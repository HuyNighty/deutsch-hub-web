import { useState } from "react";
import useLogin from "../../hooks/useLogin";

import classNames from "classnames/bind";
import styles from "./LoginForm.module.scss";
import { Button } from "@/shared/ui/components/button";

const cx = classNames.bind(styles);

export default function LoginForm() {
  const { handleLogin } = useLogin();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();

    try {
      await handleLogin({
        usernameOrEmail,
        password,
      });
    } catch {
      alert("Login failed");
    }
  }

  return (
    <form className={cx("form")} onSubmit={onSubmit}>
      <h1 className={cx("title")}>Login</h1>

      <div className={cx("field")}>
        <label htmlFor="usernameOrEmail">Username or Email</label>

        <input
          id="usernameOrEmail"
          type="text"
          placeholder="Enter your username or email"
          autoComplete="username"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
        />
      </div>

      <div className={cx("field")}>
        <label htmlFor="password">Password</label>

        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" fullWidth>
        Login
      </Button>
    </form>
  );
}
