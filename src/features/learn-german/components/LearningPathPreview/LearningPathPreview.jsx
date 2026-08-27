import classNames from "classnames/bind";

import styles from "./LearningPathPreview.module.scss";

const cx = classNames.bind(styles);

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function LearningPathPreview() {
  return (
    <div className={cx("card")}>
      <span className={cx("eyebrow")}>YOUR GERMAN JOURNEY</span>

      <h2 className={cx("title")}>
        One level
        <br />
        at a time.
      </h2>

      <div className={cx("levels")}>
        {levels.map((level, index) => (
          <div key={level} className={cx("level-wrapper")}>
            <span className={cx("level", { first: index === 0 })}>{level}</span>

            {index < levels.length - 1 && (
              <span className={cx("line")} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <p className={cx("description")}>
        Explore structured German courses from beginner to advanced level.
      </p>

      <span className={cx("footer")}>A1 → C2</span>
    </div>
  );
}
