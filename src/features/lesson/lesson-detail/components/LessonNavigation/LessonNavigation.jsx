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
    navigate(buildLessonPath(previousLessonId));
  };

  const handleNext = () => {
    navigate(buildLessonPath(nextLessonId));
  };

  return (
    <nav className={cx("navigation")}>
      <Button
        variant="outline"
        disabled={!previousLessonId}
        onClick={handlePrevious}
      >
        Previous
      </Button>

      <Button disabled={!nextLessonId} onClick={handleNext}>
        Next
      </Button>
    </nav>
  );
}
