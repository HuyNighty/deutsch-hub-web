import { useState } from "react";

import {
  faArrowLeft,
  faBookOpen,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobeEurope,
  faGraduationCap,
  faLock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import useLogin from "../../hooks/useLogin";

import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";

import classNames from "classnames/bind";
import styles from "./LoginForm.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const cx = classNames.bind(styles);

export default function LoginForm() {
  const { handleLogin } = useLogin();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();

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
    <div className={cx("login-page")}>
      <div className={cx("background")} aria-hidden="true">
        <div className={cx("background-image")} />
        <div className={cx("background-overlay")} />
        <div className={cx("background-gradient")} />
      </div>

      <div className={cx("container")}>
        <div className={cx("layout")}>
          <section className={cx("brand-section")}>
            <div className={cx("brand-content")}>
              <AppLink to="/" variant="dark" className={cx("brand")}>
                <span className={cx("brand-icon")}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>

                <span>
                  <strong className={cx("brand-name")}>DeutschHub</strong>

                  <span className={cx("brand-tagline")}>
                    Learn. Discover. Connect.
                  </span>
                </span>
              </AppLink>

              <p className={cx("brand-description")}>
                Learn German, understand Germany, and build your future through
                one connected learning experience.
              </p>
            </div>

            <div className={cx("feature-list")}>
              <div className={cx("feature")}>
                <div className={cx("feature-icon", "learning")}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>

                <div>
                  <h2>Learn German</h2>
                  <p>
                    Courses, lessons, vocabulary, and structured learning paths.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "content")}>
                  <FontAwesomeIcon icon={faGlobeEurope} />
                </div>

                <div>
                  <h2>Explore Germany</h2>
                  <p>
                    Discover German culture, history, places, and everyday life.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "communication")}>
                  <FontAwesomeIcon icon={faUsers} />
                </div>

                <div>
                  <h2>Connect with others</h2>
                  <p>
                    Share experiences and learn together with the community.
                  </p>
                </div>
              </div>
            </div>

            <div className={cx("brand-footer")}>
              <span>LEARN</span>
              <span>DISCOVER</span>
              <span>CONNECT</span>
            </div>
          </section>

          <section className={cx("form-section")}>
            <div className={cx("form-card")}>
              <div className={cx("form-content")}>
                <div className={cx("form-header")}>
                  <AppLink to="/" variant="outline" className={cx("home-link")}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Home</span>
                  </AppLink>

                  <div className={cx("header-copy")}>
                    <span className={cx("eyebrow")}>WELCOME BACK</span>

                    <h1 className={cx("title")}>Welcome back</h1>

                    <p className={cx("description")}>
                      Login to continue your journey with DeutschHub.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className={cx("error")} role="alert">
                    {error}
                  </div>
                )}

                <form className={cx("login-form")} onSubmit={onSubmit}>
                  <div className={cx("field")}>
                    <label htmlFor="usernameOrEmail">Username or Email</label>

                    <div
                      className={cx("input-wrapper", {
                        focused: focusedField === "usernameOrEmail",
                      })}
                    >
                      <span className={cx("input-icon")}>
                        <FontAwesomeIcon icon={faEnvelope} />
                      </span>

                      <input
                        id="usernameOrEmail"
                        type="text"
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        value={usernameOrEmail}
                        onChange={(event) =>
                          setUsernameOrEmail(event.target.value)
                        }
                        onFocus={() => setFocusedField("usernameOrEmail")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div className={cx("field")}>
                    <label htmlFor="password">Password</label>

                    <div
                      className={cx("input-wrapper", {
                        focused: focusedField === "password",
                      })}
                    >
                      <span className={cx("input-icon")}>
                        <FontAwesomeIcon icon={faLock} />
                      </span>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                      />

                      {password && (
                        <button
                          type="button"
                          className={cx("password-toggle")}
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={cx("form-options")}>
                    <label className={cx("remember")}>
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>

                    <AppLink
                      to="/forgot-password"
                      variant="default"
                      className={cx("forgot")}
                    >
                      Forgot password?
                    </AppLink>
                  </div>

                  <Button type="submit" variant="primary" fullWidth>
                    Login to DeutschHub
                    <span className={cx("button-arrow")}>→</span>
                  </Button>
                </form>

                <div className={cx("register")}>
                  <span>Don't have an account?</span>

                  <AppLink to="/register" variant="default">
                    Create one
                  </AppLink>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
