import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./Footer.module.scss";

const cx = classNames.bind(styles);

const featureLinks = [
  {
    label: "Học tiếng Đức",
    to: "/learn-german",
    color: "learning",
  },
  {
    label: "Khám phá nước Đức",
    to: "/explore-germany",
    color: "content",
  },
  {
    label: "Du học Đức",
    to: "/study-in-germany",
    color: "study",
  },
  {
    label: "Giao lưu",
    to: "/experiences",
    color: "communication",
  },
];

const platformLinks = [
  {
    label: "Về DeutschHub",
    to: "/",
  },
  {
    label: "Tài khoản",
    to: "/account",
  },
];

export default function Footer() {
  return (
    <footer className={cx("footer")} lang="vi">
      <div className={cx("container")}>
        <div className={cx("main")}>
          <div className={cx("brand-section")}>
            <AppLink to="/" variant="dark" className={cx("brand")} aria-label="Trang chủ DeutschHub">
              <span className={cx("brand-mark")}>D</span>

              <span className={cx("brand-name")}>DeutschHub</span>
            </AppLink>

            <p className={cx("description")}>
              Học tiếng Đức, tìm hiểu nước Đức và xây dựng tương lai của bạn
              trên cùng một nền tảng.
            </p>
          </div>

          <div className={cx("link-group")}>
            <h2>Khám phá</h2>

            <nav aria-label="Điều hướng tính năng">
              <ul>
                {featureLinks.map((link) => (
                  <li key={link.to}>
                    <AppLink
                      to={link.to}
                      variant="dark"
                      className={cx("footer-link", link.color)}
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={cx("link-group")}>
            <h2>DeutschHub</h2>

            <nav aria-label="Điều hướng DeutschHub">
              <ul>
                {platformLinks.map((link) => (
                  <li key={link.to}>
                    <AppLink
                      to={link.to}
                      variant="dark"
                      className={cx("footer-link")}
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className={cx("bottom")}>
          <span>© 2026 DeutschHub</span>

          <span>Học tập · Khám phá · Kết nối</span>
        </div>
      </div>
    </footer>
  );
}
