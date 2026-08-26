import { Link, NavLink } from "react-router-dom";

import { useAuth } from "@/features/auth/context/AuthProvider";

import classNames from "classnames/bind";
import styles from "./Header.module.scss";

const cx = classNames.bind(styles);

const navigationItems = [
  {
    label: "Learning",
    path: "/learn-german",
    color: "learning",
  },
  {
    label: "Content",
    path: "/explore-germany",
    color: "content",
  },
  {
    label: "Study",
    path: "/study-in-germany",
    color: "study",
  },
  {
    label: "Communication",
    path: "/experiences",
    color: "communication",
  },
];

export default function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className={cx("header")}>
      <div className={cx("container")}>
        <Link to="/" className={cx("brand")}>
          <span className={cx("brand-mark")}>D</span>

          <span className={cx("brand-name")}>
            Deutsch<span>Hub</span>
          </span>
        </Link>

        <nav className={cx("navigation")} aria-label="Main navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cx("nav-link", item.color, {
                  active: isActive,
                })
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={cx("actions")}>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className={cx("icon-button")}
                aria-label="Notifications"
              >
                🔔
              </button>

              <Link to="/account" className={cx("user")}>
                <span className={cx("avatar")}>
                  {user?.id?.charAt(0)?.toUpperCase() ?? "U"}
                </span>

                <span className={cx("user-name")}>Account</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={cx("login")}>
                Login
              </Link>

              <Link to="/register" className={cx("register")}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
