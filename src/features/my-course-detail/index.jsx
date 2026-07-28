import { useParams } from "react-router-dom";

import MyCourseHeader from "./components/MyCourseHeader/MyCourseHeader";
import MyCourseProgress from "./components/MyCourseProgress/MyCourseProgress";
import MyCourseSectionList from "./components/MyCourseSectionList/MyCourseSectionList";
import useMyCourseDetail from "./hooks/useMyCourseDetail";
import ResourceState from "@/shared/ui/state/ResourceState";

import classNames from "classnames/bind";
import styles from "./MyCourseDetail.module.scss";

const cx = classNames.bind(styles);

function MyCourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error, refetch } = useMyCourseDetail(courseId);

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
    >
      {course && (
        <>
          <main className={cx("page")}>
            <MyCourseHeader course={course} />

            <MyCourseProgress course={course} />

            <MyCourseSectionList
              courseId={courseId}
              sections={course.sections}
            />
          </main>
        </>
      )}
    </ResourceState>
  );
}

export default MyCourseDetail;
