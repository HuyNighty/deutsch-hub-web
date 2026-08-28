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

  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();

    setError("");

    if (!usernameOrEmail.trim() || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    try {
      await handleLogin({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });
    } catch {
      setError("Invalid username/email or password.");
    }
  }

  return (
    <form className={cx("form")} onSubmit={onSubmit}>
      <header className={cx("header")}>
        <span className={cx("eyebrow")}>WELCOME BACK</span>

        <h1 className={cx("title")}>Login to DeutschHub</h1>

        <p className={cx("description")}>
          Continue learning German and exploring Germany.
        </p>
      </header>

      <div className={cx("fields")}>
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
      </div>

      {error && (
        <p className={cx("error")} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth>
        Login
      </Button>
    </form>
  );
}
