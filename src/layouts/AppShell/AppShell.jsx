import { Outlet } from "react-router-dom";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

import classNames from "classnames/bind";
import styles from "./AppShell.module.scss";

const cx = classNames.bind(styles);

export default function AppShell() {
  return (
    <div className={cx("app")}>
      <Header />

      <main className={cx("main")}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
