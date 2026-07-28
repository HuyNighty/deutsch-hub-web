import classNames from "classnames/bind";
import styles from "./LessonList.module.scss";

import { LessonItem } from "./LessonItem";

const cx = classNames.bind(styles);

export default function LessonList({ lessons }) {
  return (
    <ul className={cx("list")}>
      {lessons.map((lesson) => (
        <LessonItem key={lesson.id} lesson={lesson} />
      ))}
    </ul>
  );
}
