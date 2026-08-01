import classNames from "classnames/bind";
import styles from "./LessonItemRenderer.module.scss";
import { LessonMediaRenderer } from "../LessonMediaRenderer";

const cx = classNames.bind(styles);

export default function LessonItemRenderer({ courseId, lessonId, items }) {
  return (
    <section className={cx("renderer")}>
      {items.map((item) => {
        switch (item.type) {
          case "TEXT":
            return (
              <div key={item.id} className={cx("textItem")}>
                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <div>{item.content}</div>
              </div>
            );

          case "MEDIA":
            return (
              <LessonMediaRenderer
                key={item.id}
                courseId={courseId}
                lessonId={lessonId}
                itemId={item.id}
                title={item.title}
              />
            );

          case "QUIZ":
            return (
              <div key={item.id} className={cx("quizPlaceholder")}>
                Quiz will be available soon.
              </div>
            );

          default:
            return (
              <div key={item.id} className={cx("unsupported")}>
                Unsupported lesson item: {item.type}
              </div>
            );
        }
      })}
    </section>
  );
}
