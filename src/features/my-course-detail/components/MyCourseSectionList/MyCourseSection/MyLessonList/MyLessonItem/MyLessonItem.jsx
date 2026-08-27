import classNames from "classnames/bind";
import styles from "./MyLessonItem.module.scss";

import { AppLink } from "@/shared/ui/components/app-link";

const cx = classNames.bind(styles);

export default function MyLessonItem({ courseId, lesson }) {
  return (
    <li className={cx("item")}>
      <AppLink
        className={cx("link")}
        to={`/my-learning/courses/${courseId}/lessons/${lesson.id}`}
      >
        <h4 className={cx("title")}>{lesson.title}</h4>

        {lesson.description && (
          <p className={cx("description")}>{lesson.description}</p>
        )}

        <span className={cx("duration")}>
          {lesson.estimatedMinutes} minutes
        </span>
      </AppLink>
    </li>
  );
}
