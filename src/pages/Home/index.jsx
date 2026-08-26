import { FeatureOverview } from "./components/FeatureOverview";

import classNames from "classnames/bind";
import styles from "./Home.module.scss";

import { AppLink } from "@/shared/ui/components/app-link";
import { ContentPreview } from "./components/ContentPreview";

const cx = classNames.bind(styles);

export default function Home() {
  return (
    <main className={cx("page")}>
      <section className={cx("hero")}>
        <div className={cx("hero-content")}>
          <span className={cx("eyebrow")}>DEUTSCHHUB</span>

          <h1 className={cx("hero-title")}>
            Learn German.
            <br />
            Understand Germany.
            <br />
            Build your future.
          </h1>

          <p className={cx("hero-description")}>
            DeutschHub brings German learning, knowledge, study opportunities,
            and community together in one place.
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

        <div className={cx("hero-visual")} aria-hidden="true">
          <div className={cx("hero-orbit", "hero-orbit-one")} />
          <div className={cx("hero-orbit", "hero-orbit-two")} />

          <div className={cx("hero-card")}>
            <div className={cx("hero-logo")}>D</div>

            <strong>DeutschHub</strong>

            <span>Lernen · Entdecken · Verbinden</span>
          </div>

          <div className={cx("hero-badge", "hero-badge-learning")}>
            <span>Learning</span>
            <strong>Deutsch</strong>
          </div>

          <div className={cx("hero-badge", "hero-badge-content")}>
            <span>Content</span>
            <strong>Deutschland</strong>
          </div>

          <div className={cx("hero-badge", "hero-badge-study")}>
            <span>Study</span>
            <strong>Zukunft</strong>
          </div>
        </div>
      </section>
      <FeatureOverview />
      <ContentPreview />
    </main>
  );
}
