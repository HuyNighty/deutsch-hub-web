import classNames from "classnames/bind";

import styles from "./ContentHero.module.scss";

const cx = classNames.bind(styles);

function ContentHero() {
  return (
    <section className={cx("hero")} aria-labelledby="content-hero-title">
      <div className={cx("copy")}>
        <span className={cx("eyebrow")}>KHÁM PHÁ NƯỚC ĐỨC</span>

        <h1 id="content-hero-title" className={cx("title")}>
          Hiểu nước Đức.
          <br />
          <span>Yêu nước Đức hơn.</span>
        </h1>

        <div className={cx("ornament")} aria-hidden="true">
          <span />
          <span>❧</span>
          <span />
        </div>

        <p className={cx("description")}>
          Những câu chuyện, kiến thức và trải nghiệm thực tế giúp bạn khám phá
          nước Đức một cách toàn diện nhất.
        </p>
      </div>

      <div className={cx("visual")} aria-hidden="true">
        <div className={cx("visual-wash")} />

        <div className={cx("visual-frame")}>
          <img
            src="/public/images/germany-hero.jpg"
            alt=""
            className={cx("image")}
          />
        </div>

        <div className={cx("stamp")}>
          DEUTSCH
          <span>✦</span>
          LAND
        </div>
      </div>
    </section>
  );
}

export default ContentHero;
