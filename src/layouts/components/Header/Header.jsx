import { useAuth } from "@/features/auth/context/AuthProvider";

import { Link, NavLink, useLocation } from "react-router-dom";

import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";

import { useEffect, useRef, useState } from "react";

import classNames from "classnames/bind";
import styles from "./Header.module.scss";

const cx = classNames.bind(styles);

const navigationItems = [
  {
    label: "Học tiếng Đức",
    path: "/learn-german",
    color: "learning",
  },
  {
    label: "Khám phá nước Đức",
    path: "/explore-germany",
    color: "content",
  },
  {
    label: "Du học Đức",
    path: "/study-in-germany",
    color: "study",
  },
  {
    label: "Giao lưu",
    path: "/experiences",
    color: "communication",
  },
];

const HEADER_HEIGHT = 72;

export default function Header() {
  const { isAuthenticated, user } = useAuth();

  const location = useLocation();

  const [hasHero, setHasHero] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTrigger = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.key]);

  useEffect(() => {
    const hero = document.querySelector("[data-header-hero]");

    if (!hero) {
      setHasHero(false);
      setIsScrolled(false);

      return;
    }

    setHasHero(true);

    function handleScroll() {
      const heroBottom = hero.getBoundingClientRect().bottom;

      setIsScrolled(heroBottom <= HEADER_HEIGHT);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [location.pathname]);

  const isOverlay = hasHero && !isScrolled;

  return (
    <header
      lang="vi"
      className={cx("header", {
        overlay: isOverlay,
        solid: !isOverlay,
      })}
    >
      <div className={cx("container")}>
        <Link to="/" className={cx("brand")} aria-label="Trang chủ DeutschHub">
          <span className={cx("brand-mark")}>D</span>

          <span className={cx("brand-name")}>
            Deutsch<span>Hub</span>
          </span>
        </Link>

        <div
          className={cx("mobile-disclosure")}
          onKeyDown={(event) => {
            if (event.key === "Escape" && mobileOpen) {
              event.preventDefault();
              setMobileOpen(false);
              mobileTrigger.current.focus();
            }
          }}
        >
          <button
            ref={mobileTrigger}
            type="button"
            className={cx("mobile-trigger")}
            aria-label="Điều hướng công khai"
            aria-expanded={mobileOpen}
            aria-controls="mobile-public-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
          <nav
            id="mobile-public-navigation"
            hidden={!mobileOpen}
            className={cx("mobile-navigation")}
            aria-label="Điều hướng chính trên thiết bị di động"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                replace={item.path === "/study-in-germany" ? false : undefined}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cx("nav-link", item.color, { active: isActive })
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <nav className={cx("navigation")} aria-label="Điều hướng chính">
          {navigationItems.map((item) => (
            <AppLink
              key={item.path}
              to={item.path}
              replace={item.path === "/study-in-germany" ? false : undefined}
              className={({ isActive }) =>
                cx("nav-link", item.color, {
                  active: isActive,
                })
              }
              variant="defaul"
              appearance="action"
              size="sm"
            >
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className={cx("actions")}>
          {isAuthenticated ? (
            <>
              <AppLink
                to="/my-learning"
                variant="default"
                appearance="action"
                size="sm"
              >
                Học tập của tôi
              </AppLink>

              <AppLink
                to="/my-learning/assessments"
                variant="primary"
                className={cx("assessment-shortcut")}
                appearance="action"
                showArrow
                size="sm"
              >
                Bài đánh giá
              </AppLink>

              <Button
                type="button"
                className={cx("icon-button")}
                aria-label="Thông báo"
              >
                🔔
              </Button>

              <AppLink
                to="/account"
                className={cx("user")}
                aria-label="Tài khoản"
              >
                <span className={cx("avatar")}>
                  {user?.id?.charAt(0)?.toUpperCase() ?? "U"}
                </span>

                <span className={cx("user-name")}>Tài khoản</span>
              </AppLink>
            </>
          ) : (
            <>
              <AppLink to="/login" variant="default" appearance="action">
                Đăng nhập
              </AppLink>

              <AppLink
                to="/register"
                variant="primary"
                appearance="action"
                showArrow
              >
                Đăng ký
              </AppLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
