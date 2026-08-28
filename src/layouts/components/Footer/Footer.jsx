import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./Footer.module.scss";

const cx = classNames.bind(styles);

const featureLinks = [
  {
    label: "Learning",
    to: "/learn-german",
    color: "learning",
  },
  {
    label: "Content",
    to: "/explore-germany",
    color: "content",
  },
  {
    label: "Study",
    to: "/study-in-germany",
    color: "study",
  },
  {
    label: "Communication",
    to: "/experiences",
    color: "communication",
  },
];

const platformLinks = [
  {
    label: "About DeutschHub",
    to: "/",
  },
  {
    label: "Account",
    to: "/account",
  },
];

export default function Footer() {
  return (
    <footer className={cx("footer")}>
      <div className={cx("container")}>
        <div className={cx("main")}>
          <div className={cx("brand-section")}>
            <AppLink to="/" variant="dark" className={cx("brand")}>
              <span className={cx("brand-mark")}>D</span>

              <span className={cx("brand-name")}>DeutschHub</span>
            </AppLink>

            <p className={cx("description")}>
              Learn German, understand Germany, and build your future in one
              connected place.
            </p>
          </div>

          <div className={cx("link-group")}>
            <h2>Explore</h2>

            <nav aria-label="Feature navigation">
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

            <nav aria-label="Platform navigation">
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

          <span>Learn · Discover · Connect</span>
        </div>
      </div>
    </footer>
  );
}
