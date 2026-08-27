import { useParams } from "react-router-dom";
import classNames from "classnames/bind";

import { useCourseDetail } from "./hooks/useCourseDetail";

import { CourseHeader } from "./components/CourseHeader";
import { CourseOverview } from "./components/CourseOverview";
import ResourceState from "@/shared/ui/state/ResourceState";

import styles from "./CourseDetail.module.scss";
import { CourseAction } from "./components/CourseAction";
import { CourseSectionList } from "./components/CourseSectionList";

const cx = classNames.bind(styles);

export default function CourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error, refetch } = useCourseDetail(courseId);

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
    >
      {course && (
        <main className={cx("page")}>
          <div className={cx("top")}>
            <CourseHeader course={course} />

            <CourseAction
              courseId={courseId}
              enrollmentStatus={course.enrollmentStatus}
            />
          </div>

          <CourseOverview course={course} />

          <CourseSectionList sections={course.sections} />
        </main>
      )}
    </ResourceState>
  );
}
