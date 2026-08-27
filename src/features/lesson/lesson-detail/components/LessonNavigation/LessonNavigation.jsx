import classNames from "classnames/bind";
import styles from "./LessonNavigation.module.scss";

import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/components/button";

const cx = classNames.bind(styles);

export default function LessonNavigation({
  courseId,
  previousLessonId,
  nextLessonId,
}) {
  const navigate = useNavigate();

  const buildLessonPath = (lessonId) =>
    `/my-learning/courses/${courseId}/lessons/${lessonId}`;

  const handlePrevious = () => {
    if (!previousLessonId) return;

    navigate(buildLessonPath(previousLessonId));
  };

  const handleNext = () => {
    if (!nextLessonId) return;

    navigate(buildLessonPath(nextLessonId));
  };

  return (
    <nav className={cx("navigation")} aria-label="Lesson navigation">
      <Button
        variant="outline"
        disabled={!previousLessonId}
        onClick={handlePrevious}
      >
        <span aria-hidden="true">←</span>
        <span>Previous lesson</span>
      </Button>

      <Button disabled={!nextLessonId} onClick={handleNext}>
        <span>Next lesson</span>
        <span aria-hidden="true">→</span>
      </Button>
    </nav>
  );
}
