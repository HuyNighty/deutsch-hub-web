import { FeatureOverview } from "./components/FeatureOverview";
import { ContentPreview } from "./components/ContentPreview";

import classNames from "classnames/bind";
import styles from "./Home.module.scss";

import { AppLink } from "@/shared/ui/components/app-link";

const cx = classNames.bind(styles);

export default function Home() {
  return (
    <div className={cx("page")}>
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
            DeutschHub brings German learning, knowledge, opportunities, and
            community together in one place.
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

          <div className={cx("hero-badge", "hero-badge-future")}>
            <span>Future</span>
            <strong>Zukunft</strong>
          </div>
        </div>
      </section>

      <FeatureOverview />

      <section className={cx("section", "learning-section")}>
        <div className={cx("section-heading")}>
          <div>
            <span className={cx("eyebrow")}>LEARN GERMAN</span>

            <h2 className={cx("section-title")}>
              Build your German,
              <br />
              step by step.
            </h2>
          </div>

          <p className={cx("section-description")}>
            Follow structured courses, practice through lessons, and build your
            German from the foundations to real communication.
          </p>
        </div>

        <div className={cx("learning-layout")}>
          <div className={cx("learning-feature")}>
            <div className={cx("level-label")}>A2 · GERMAN</div>

            <h3>Everyday German Communication</h3>

            <p>
              Build the grammar, vocabulary, and communication skills you need
              for everyday situations.
            </p>

            <div className={cx("progress")}>
              <div className={cx("progress-label")}>
                <span>Course progress</span>
                <strong>0%</strong>
              </div>

              <div className={cx("progress-track")}>
                <div className={cx("progress-value")} />
              </div>
            </div>

            <AppLink to="/learn-german" variant="primary">
              Explore courses
            </AppLink>
          </div>

          <div className={cx("learning-courses")}>
            <article className={cx("mini-course")}>
              <span>A1</span>
              <h3>German Foundations</h3>
              <p>Build your first German vocabulary and grammar.</p>
              <AppLink to="/learn-german">Start →</AppLink>
            </article>

            <article className={cx("mini-course")}>
              <span>A2</span>
              <h3>Everyday German</h3>
              <p>Understand and communicate in everyday situations.</p>
              <AppLink to="/learn-german">Explore →</AppLink>
            </article>

            <article className={cx("mini-course")}>
              <span>B1</span>
              <h3>German Communication</h3>
              <p>Move towards confident real-world communication.</p>
              <AppLink to="/learn-german">Explore →</AppLink>
            </article>
          </div>
        </div>
      </section>

      <ContentPreview />

      <section className={cx("section", "explore-section")}>
        <div className={cx("section-heading")}>
          <div>
            <span className={cx("eyebrow")}>EXPLORE GERMANY</span>

            <h2 className={cx("section-title")}>
              Go beyond
              <br />
              the language.
            </h2>
          </div>

          <p className={cx("section-description")}>
            Language becomes easier when you understand the country, culture,
            people, and everyday life behind it.
          </p>
        </div>

        <div className={cx("explore-grid")}>
          <article className={cx("explore-card", "explore-large")}>
            <div className={cx("explore-number")}>01</div>

            <div>
              <span>Culture</span>
              <h3>Understand German culture.</h3>
              <p>
                Discover traditions, customs, and the ideas that shape life in
                Germany.
              </p>
            </div>

            <AppLink to="/explore-germany">Explore culture →</AppLink>
          </article>

          <article className={cx("explore-card")}>
            <div className={cx("explore-number")}>02</div>

            <span>Places</span>
            <h3>Discover Germany.</h3>

            <p>Cities, regions, landmarks, and places worth knowing.</p>
          </article>

          <article className={cx("explore-card")}>
            <div className={cx("explore-number")}>03</div>

            <span>Everyday Life</span>
            <h3>See how Germany works.</h3>

            <p>Everyday habits, social life, food, work, and more.</p>
          </article>

          <article className={cx("explore-card")}>
            <div className={cx("explore-number")}>04</div>

            <span>History</span>
            <h3>Know where Germany came from.</h3>

            <p>Explore the history behind today's Germany.</p>
          </article>
        </div>
      </section>

      <section className={cx("section", "future-section")}>
        <div className={cx("future-content")}>
          <span className={cx("eyebrow")}>BUILD YOUR FUTURE</span>

          <h2 className={cx("section-title")}>
            Learning German
            <br />
            is only the beginning.
          </h2>

          <p className={cx("section-description")}>
            Whether you want to study, work, or build a life in Germany,
            DeutschHub helps you move beyond the classroom.
          </p>

          <AppLink to="/study-in-germany" variant="primary">
            Explore your future
          </AppLink>
        </div>

        <div className={cx("future-grid")}>
          <article>
            <span>01</span>
            <h3>Study</h3>
            <p>Universities, scholarships, student life, and opportunities.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Career</h3>
            <p>Skills, work, and opportunities connected to Germany.</p>
          </article>

          <article>
            <span>03</span>
            <h3>Life</h3>
            <p>Understand the practical side of building a life in Germany.</p>
          </article>
        </div>
      </section>

      <section className={cx("community-section")}>
        <div className={cx("community-content")}>
          <span className={cx("eyebrow")}>COMMUNITY</span>

          <h2 className={cx("section-title")}>
            You don't have to
            <br />
            learn alone.
          </h2>

          <p className={cx("section-description")}>
            Learn, share, ask questions, and connect with people who are walking
            a similar path.
          </p>

          <AppLink to="/experiences" variant="outline">
            Discover the community
          </AppLink>
        </div>

        <div className={cx("community-quote")}>
          <span>“</span>

          <p>
            Learning a language is not only about understanding words. It is
            about understanding people.
          </p>

          <small>— DeutschHub</small>
        </div>
      </section>

      <section className={cx("final-cta")}>
        <span className={cx("eyebrow")}>DEUTSCHHUB</span>

        <h2>
          Start your journey
          <br />
          with Germany.
        </h2>

        <p>Learn the language. Explore the country. Build your future.</p>

        <AppLink to="/learn-german" variant="primary" size="lg">
          Start learning
        </AppLink>
      </section>
    </div>
  );
}
