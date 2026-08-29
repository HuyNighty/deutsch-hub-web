import { FeatureOverview } from "./components/FeatureOverview";
import { ContentPreview } from "./components/ContentPreview";

import classNames from "classnames/bind";
import styles from "./Home.module.scss";

import { AppLink } from "@/shared/ui/components/app-link";

const cx = classNames.bind(styles);

export default function Home() {
  return (
    <div className={cx("page")}>
      <section
        className={cx("hero")}
        data-header-hero
        aria-labelledby="home-hero-title"
      >
        <div className={cx("hero-background")} aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=85"
            alt=""
          />
        </div>

        <div className={cx("hero-overlay")} aria-hidden="true" />

        <div className={cx("hero-inner")}>
          <div className={cx("hero-content")}>
            <span className={cx("eyebrow")}>DEUTSCHHUB</span>

            <h1 id="home-hero-title" className={cx("hero-title")}>
              Học tiếng Đức.
              <br />
              Hiểu về nước Đức.
              <br />
              <span>Xây dựng tương lai.</span>
            </h1>

            <p className={cx("hero-description")}>
              DeutschHub kết nối việc học tiếng Đức, kiến thức về nước Đức, cơ
              hội học tập và cộng đồng trong một không gian thống nhất.
            </p>

            <div className={cx("hero-actions")}>
              <AppLink to="/learn-german" variant="primary" size="lg">
                Bắt đầu học
              </AppLink>

              <AppLink to="/explore-germany" variant="outline" size="lg">
                Khám phá nước Đức
              </AppLink>
            </div>
          </div>

          <div className={cx("hero-side")} aria-hidden="true">
            <div className={cx("hero-side-card")}>
              <span className={cx("side-card-label")}>DEUTSCHHUB</span>

              <strong>Nước Đức không chỉ là một ngôn ngữ.</strong>

              <p>
                Học ngôn ngữ. Khám phá đất nước. Xây dựng chương tiếp theo của
                bạn.
              </p>
            </div>
          </div>
        </div>

        <div className={cx("hero-bottom")}>
          <div className={cx("hero-pillars")}>
            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>01</span>

              <div>
                <strong>Học</strong>
                <span>Học tiếng Đức có hệ thống</span>
              </div>
            </div>

            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>02</span>

              <div>
                <strong>Khám phá</strong>
                <span>Văn hóa, địa điểm và câu chuyện</span>
              </div>
            </div>

            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>03</span>

              <div>
                <strong>Kết nối</strong>
                <span>Con người, trải nghiệm và ý tưởng</span>
              </div>
            </div>
          </div>

          <div className={cx("scroll-hint")}>
            <span>Cuộn để khám phá</span>

            <span className={cx("scroll-line")}>
              <span className={cx("scroll-dot")} />
            </span>
          </div>
        </div>
      </section>

      <FeatureOverview />

      <ContentPreview />
    </div>
  );
}
