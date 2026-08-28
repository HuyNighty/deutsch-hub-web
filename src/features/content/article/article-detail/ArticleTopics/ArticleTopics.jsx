import classNames from "classnames/bind";
import styles from "./ArticleTopics.module.scss";

const cx = classNames.bind(styles);

export default function ArticleTopics({ topics = [] }) {
  if (!topics.length) {
    return null;
  }

  return (
    <section className={cx("topics")}>
      <h2 className={cx("heading")}>Topics</h2>

      <div className={cx("list")}>
        {topics.map((topic) => (
          <span key={topic.id} className={cx("topic")}>
            {topic.name}
          </span>
        ))}
      </div>
    </section>
  );
}
