import classNames from "classnames/bind";
import styles from "./CourseAction.module.scss";

import { useNavigate } from "react-router-dom";

import { useEnrollAction } from "../../hooks/useEnrollAction";
import { Button } from "@/shared/ui/components/button";

const cx = classNames.bind(styles);

export default function CourseAction({ courseId, enrollmentStatus }) {
  const navigate = useNavigate();

  const { handleEnroll } = useEnrollAction(courseId);

  let button;

  switch (enrollmentStatus) {
    case "ENROLLED":
    case "IN_PROGRESS":
      button = (
        <Button onClick={() => navigate(`/my-learning/courses/${courseId}`)}>
          Continue Learning
        </Button>
      );
      break;

    case "COMPLETED":
      button = <Button>View Certificate</Button>;
      break;

    default:
      button = <Button onClick={handleEnroll}>Enroll Course</Button>;
  }

  return <aside className={cx("action")}>{button}</aside>;
}
