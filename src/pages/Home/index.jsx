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
        data-home-hero
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
              Learn German.
              <br />
              Understand Germany.
              <br />
              <span>Build your future.</span>
            </h1>

            <p className={cx("hero-description")}>
              DeutschHub brings German learning, knowledge, study opportunities,
              and community together in one connected place.
            </p>

            <div className={cx("hero-actions")}>
              <AppLink to="/learn-german" variant="primary" size="lg">
                Start learning
              </AppLink>

              <AppLink to="/explore-germany" variant="outline" size="lg">
                Explore Germany
              </AppLink>
            </div>
          </div>

          <div className={cx("hero-side")} aria-hidden="true">
            <div className={cx("hero-side-card")}>
              <span className={cx("side-card-label")}>DEUTSCHHUB</span>

              <strong>Germany is more than a language.</strong>

              <p>
                Learn the language. Discover the country. Build your next
                chapter.
              </p>
            </div>
          </div>
        </div>

        <div className={cx("hero-bottom")}>
          <div className={cx("hero-pillars")}>
            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>01</span>

              <div>
                <strong>Learn</strong>
                <span>Structured German learning</span>
              </div>
            </div>

            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>02</span>

              <div>
                <strong>Discover</strong>
                <span>Culture, places and stories</span>
              </div>
            </div>

            <div className={cx("pillar")}>
              <span className={cx("pillar-number")}>03</span>

              <div>
                <strong>Connect</strong>
                <span>People, experiences and ideas</span>
              </div>
            </div>
          </div>

          <div className={cx("scroll-hint")}>
            <span>Scroll to explore</span>

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
