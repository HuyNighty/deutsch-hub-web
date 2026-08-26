import { Link } from "react-router-dom";
import classNames from "classnames/bind";

import styles from "./FeatureOverview.module.scss";

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
  },
  {
    key: "content",
    label: "Content",
    title: "Explore Germany",
    description:
      "Discover German culture, history, places, stories, and useful knowledge beyond the classroom.",
    action: "Explore content",
    to: "/explore-germany",
  },
  {
    key: "study",
    label: "Study",
    title: "Build your future",
    description:
      "Find information and opportunities for studying, living, and building your future in Germany.",
    action: "Explore study",
    to: "/study-in-germany",
  },
  {
    key: "communication",
    label: "Communication",
    title: "Connect with others",
    description:
      "Share experiences, ask questions, and connect with people who are also learning and exploring Germany.",
    action: "Join the community",
    to: "/experiences",
  },
];

export default function FeatureOverview() {
  return (
    <section className={cx("section")} aria-labelledby="feature-overview-title">
      <div className={cx("header")}>
        <span className={cx("eyebrow")}>DEUTSCHHUB</span>

        <h2 id="feature-overview-title" className={cx("title")}>
          Everything German,
          <br />
          in one place.
        </h2>

        <p className={cx("description")}>
          Learn the language, discover Germany, plan your future, and connect
          with others through one connected platform.
        </p>
      </div>

      <div className={cx("grid")}>
        {features.map((feature, index) => (
          <article
            key={feature.key}
            className={cx("card", `card-${feature.key}`)}
          >
            <div className={cx("card-top")}>
              <span className={cx("label")}>{feature.label}</span>

              <span className={cx("number")}>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className={cx("card-body")}>
              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </div>

            <Link to={feature.to} className={cx("card-action")}>
              <span>{feature.action}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
