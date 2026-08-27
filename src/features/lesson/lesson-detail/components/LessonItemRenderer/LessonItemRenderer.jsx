import classNames from "classnames/bind";
import styles from "./LessonItemRenderer.module.scss";

import { TextItem } from "../../lesson-items/TextItem";
import { LessonMediaRenderer } from "../LessonMediaRenderer";

const cx = classNames.bind(styles);

export default function LessonItemRenderer({ courseId, lessonId, items = [] }) {
  return (
    <section className={cx("renderer")}>
      {items.map((item) => {
        switch (item.type) {
          case "TEXT":
            return <TextItem key={item.id} item={item} />;

          case "MEDIA":
            return (
              <LessonMediaRenderer
                key={item.id}
                courseId={courseId}
                lessonId={lessonId}
                itemId={item.id}
                title={item.title}
                description={item.description}
              />
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
