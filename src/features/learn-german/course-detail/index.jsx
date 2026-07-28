import { useParams } from "react-router-dom";
import classNames from "classnames/bind";

import { useCourseDetail } from "./hooks/useCourseDetail";

import CourseHeader from "./components/CourseHeader/CourseHeader";
import CourseOverview from "./components/CourseOverview/CourseOverview";
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
          <CourseHeader course={course} />

          <div className={cx("content")}>
            <CourseOverview course={course} />

            <CourseAction
              courseId={course.id}
              enrollmentStatus={course.enrollmentStatus}
            />
          </div>

          <CourseSectionList sections={course.sections} />
        </main>
      )}
    </ResourceState>
  );
}
