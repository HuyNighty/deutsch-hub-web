import { useAuth } from "@/features/auth/context/AuthProvider";

import { Link, NavLink, useLocation } from "react-router-dom";

import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";

import { useEffect, useState } from "react";

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

const HEADER_HEIGHT = 72;

export default function Header() {
  const { isAuthenticated, user } = useAuth();

  const location = useLocation();

  const [hasHero, setHasHero] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      className={cx("header", {
        overlay: isOverlay,
        solid: !isOverlay,
      })}
    >
      <div className={cx("container")}>
        <Link to="/" className={cx("brand")} aria-label="DeutschHub Home">
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
              <Button
                type="button"
                className={cx("icon-button")}
                aria-label="Notifications"
              >
                🔔
              </Button>

              <AppLink to="/account" className={cx("user")}>
                <span className={cx("avatar")}>
                  {user?.id?.charAt(0)?.toUpperCase() ?? "U"}
                </span>

                <span className={cx("user-name")}>Account</span>
              </AppLink>
            </>
          ) : (
            <>
              <AppLink to="/login" variant="outline">
                Login
              </AppLink>

              <AppLink to="/register" variant="primary">
                Get started
              </AppLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
