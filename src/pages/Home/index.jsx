import { Link } from "react-router-dom";

import classNames from "classnames/bind";

import styles from "./Home.module.scss";
import LogoutButton from "@/features/auth/login/components/LogoutButton";
import { useAuth } from "@/features/auth/context/AuthProvider";

const cx = classNames.bind(styles);

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className={cx("page")}>
      <header className={cx("hero")}>
        <h1 className={cx("title")}>DeutschHub</h1>

        <p className={cx("subtitle")}>
          Learn German, explore Germany, and achieve your study goals.
        </p>
      </header>

      <nav className={cx("navigation")}>
        <ul className={cx("list")}>
          <li>
            <Link to="/learn-german">Learn German</Link>
          </li>

          <li>
            <Link to="/explore-germany">Explore Germany</Link>
          </li>

          <li>
            <Link to="/study-in-germany">Study in Germany</Link>
          </li>

          <li>
            <Link to="/experiences">Experiences</Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/my-learning">My Learning</Link>
              </li>

              <li>
                <Link to="/account">Account</Link>
              </li>

              <li>
                <LogoutButton />
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>

              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </main>
  );
}
