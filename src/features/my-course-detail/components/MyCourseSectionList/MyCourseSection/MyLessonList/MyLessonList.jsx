import classNames from "classnames/bind";
import styles from "./MyLessonList.module.scss";

import { MyLessonItem } from "./MyLessonItem";

const cx = classNames.bind(styles);

export default function MyLessonList({ courseId, lessons }) {
  return (
    <ul className={cx("list")}>
      {lessons.map((lesson) => (
        <MyLessonItem key={lesson.id} courseId={courseId} lesson={lesson} />
      ))}
    </ul>
  );
}
