import { useState } from "react";
import { useLocation } from "react-router-dom";

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
  const { handleLogin, loading } = useLogin();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!usernameOrEmail.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập/email và mật khẩu.");
      return;
    }

    try {
      await handleLogin({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });
    } catch (failure) {
      setError(failure.status === 403 && failure.code === 4005
        ? "Tài khoản của bạn đã bị vô hiệu hóa. Bạn chỉ có thể đăng nhập sau khi tài khoản được kích hoạt lại."
        : "Không thể đăng nhập. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu.");
    }
  }

  return (
    <div className={cx("login-page")} lang="vi">
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
                    Học tập. Khám phá. Kết nối.
                  </span>
                </span>
              </AppLink>

              <p className={cx("brand-description")}>
                Học tiếng Đức, tìm hiểu nước Đức và xây dựng tương lai của bạn
                qua một trải nghiệm học tập kết nối.
              </p>
            </div>

            <div className={cx("feature-list")}>
              <div className={cx("feature")}>
                <div className={cx("feature-icon", "learning")}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>

                <div>
                  <h2>Học tiếng Đức</h2>
                  <p>
                    Các khóa học, bài học, từ vựng và lộ trình học tập có cấu trúc.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "content")}>
                  <FontAwesomeIcon icon={faGlobeEurope} />
                </div>

                <div>
                  <h2>Khám phá nước Đức</h2>
                  <p>
                    Khám phá văn hóa, lịch sử, các địa điểm và cuộc sống hằng ngày tại Đức.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "communication")}>
                  <FontAwesomeIcon icon={faUsers} />
                </div>

                <div>
                  <h2>Kết nối với mọi người</h2>
                  <p>
                    Chia sẻ trải nghiệm và cùng học tập với cộng đồng.
                  </p>
                </div>
              </div>
            </div>

            <div className={cx("brand-footer")}>
              <span>HỌC TẬP</span>
              <span>KHÁM PHÁ</span>
              <span>KẾT NỐI</span>
            </div>
          </section>

          <section className={cx("form-section")}>
            <div className={cx("form-card")}>
              <div className={cx("form-content")}>
                <div className={cx("form-header")}>
                  <AppLink to="/" variant="outline" className={cx("home-link")}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Trang chủ</span>
                  </AppLink>

                  <div className={cx("header-copy")}>
                    <span className={cx("eyebrow")}>CHÀO MỪNG TRỞ LẠI</span>

                    <h1 className={cx("title")}>Chào mừng bạn trở lại</h1>

                    <p className={cx("description")}>
                      Đăng nhập để tiếp tục hành trình của bạn cùng DeutschHub.
                    </p>
                  </div>
                </div>

                {location.state?.passwordChanged === true && (
                  <p className={cx("status")} role="status">
                    Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại.
                  </p>
                )}

                {location.state?.sessionEnded === true && (
                  <p className={cx("status")} role="status">
                    Phiên đăng nhập của bạn đã kết thúc. Vui lòng đăng nhập lại.
                  </p>
                )}

                {location.state?.allSessionsRevoked === true && (
                  <p className={cx("status")} role="status">
                    Tất cả phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.
                  </p>
                )}

                {location.state?.accountDeactivated === true && (
                  <p className={cx("status")} role="status">
                    Tài khoản của bạn đã bị vô hiệu hóa. Bạn chỉ có thể đăng nhập sau khi tài khoản được kích hoạt lại.
                  </p>
                )}

                {error && (
                  <div className={cx("error")} role="alert">
                    {error}
                  </div>
                )}

                <form className={cx("login-form")} onSubmit={onSubmit}>
                  <div className={cx("field")}>
                    <label htmlFor="usernameOrEmail">Tên đăng nhập hoặc email</label>

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
                        placeholder="Nhập tên đăng nhập hoặc email"
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
                    <label htmlFor="password">Mật khẩu</label>

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
                        placeholder="Nhập mật khẩu"
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
                            showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
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
                      <span>Ghi nhớ đăng nhập</span>
                    </label>

                    <AppLink
                      to="/forgot-password"
                      variant="default"
                      className={cx("forgot")}
                    >
                      Quên mật khẩu?
                    </AppLink>
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={loading}>
                    Đăng nhập vào DeutschHub
                    <span className={cx("button-arrow")}>→</span>
                  </Button>
                </form>

                <div className={cx("register")}>
                  <span>Bạn chưa có tài khoản?</span>

                  <AppLink to="/register" variant="default" state={{ returnTo: location.state?.returnTo }}>
                    Đăng ký
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
