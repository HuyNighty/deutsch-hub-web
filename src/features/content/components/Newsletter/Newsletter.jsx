import { useState } from "react";

import classNames from "classnames/bind";
import styles from "./Newsletter.module.scss";

const cx = classNames.bind(styles);

function Newsletter() {
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    // TODO: connect newsletter API later
    setEmail("");
  }

  return (
    <section className={cx("section")} aria-labelledby="newsletter-title">
      <div className={cx("ornament")} aria-hidden="true">
        ✦
      </div>

      <div className={cx("content")}>
        <span className={cx("eyebrow")}>LUÔN CẬP NHẬT</span>

        <h2 id="newsletter-title" className={cx("title")}>
          Những câu chuyện đáng để
          <br />
          đọc mỗi tuần.
        </h2>

        <p className={cx("description")}>
          Một tuyển chọn nhỏ về nước Đức, ngôn ngữ, văn hóa và những điều thú vị
          đáng để bạn khám phá.
        </p>

        <form className={cx("form")} onSubmit={handleSubmit}>
          <label className={cx("label")} htmlFor="newsletter-email">
            Email của bạn
          </label>

          <div className={cx("input-row")}>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <button type="submit">
              Đăng ký
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>

      <div className={cx("seal")} aria-hidden="true">
        <span>DEUTSCH</span>
        <strong>✦</strong>
        <span>HUB</span>
      </div>
    </section>
  );
}

export default Newsletter;
