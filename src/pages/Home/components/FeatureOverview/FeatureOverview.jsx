import classNames from "classnames/bind";

import styles from "./FeatureOverview.module.scss";
import { AppLink } from "@/shared/ui/components/app-link";

const cx = classNames.bind(styles);

const features = [
  {
    key: "learning",
    label: "Learning",
    title: "Learn German",
    description:
      "Build your German step by step with courses, lessons, vocabulary, and structured learning paths.",
    action: "Start learning",
    to: "/learn-german",
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1400&q=85",
  },
  {
    key: "content",
    label: "Content",
    title: "Explore Germany",
    description:
      "Discover German culture, history, places, stories, and useful knowledge beyond the classroom.",
    action: "Explore content",
    to: "/explore-germany",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    key: "study",
    label: "Study",
    title: "Build your future",
    description:
      "Find information and opportunities for studying, living, and building your future in Germany.",
    action: "Explore study",
    to: "/study-in-germany",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=85",
  },
  {
    key: "communication",
    label: "Communication",
    title: "Connect with others",
    description:
      "Share experiences, ask questions, and connect with people who are also learning and exploring Germany.",
    action: "Join the community",
    to: "/experiences",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85",
  },
];

export default function FeatureOverview() {
  return (
    <section className={cx("section")} aria-labelledby="feature-overview-title">
      <div className={cx("header")}>
        <div className={cx("header-copy")}>
          <span className={cx("eyebrow")}>THE DEUTSCHHUB EXPERIENCE</span>

          <h2 id="feature-overview-title" className={cx("title")}>
            Everything German,
            <br />
            <span>in one place.</span>
          </h2>
        </div>

        <p className={cx("description")}>
          DeutschHub connects language learning with the world around it. Learn
          German, discover Germany, plan your future, and connect with people
          along the way.
        </p>
      </div>

      <div className={cx("grid")}>
        {features.map((feature, index) => (
          <article
            key={feature.key}
            className={cx("card", `feature-${feature.key}`)}
          >
            <img
              className={cx("card-image")}
              src={feature.image}
              alt=""
              loading="lazy"
            />

            <div className={cx("card-overlay")} />

            <div className={cx("card-content")}>
              <div className={cx("card-top")}>
                <span className={cx("label")}>{feature.label}</span>

                <span className={cx("number")}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className={cx("card-bottom")}>
                <div className={cx("card-copy")}>
                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>
                </div>

                <AppLink
                  to={feature.to}
                  variant="dark"
                  className={cx("card-action")}
                >
                  <span>{feature.action}</span>

                  <span className={cx("arrow")} aria-hidden="true">
                    →
                  </span>
                </AppLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
