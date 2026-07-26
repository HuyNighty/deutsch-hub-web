import { useParams } from "react-router-dom";

import MyCourseHeader from "./components/MyCourseHeader";
import MyCourseProgress from "./components/MyCourseProgress";
import MyCourseSectionList from "./components/MyCourseSectionList";
import useMyCourseDetail from "./hooks/useMyCourseDetail";
import ResourceState from "@/shared/ui/state/ResourceState";

function MyCourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error } = useMyCourseDetail(courseId);

  return (
    <ResourceState loading={loading} error={error}>
      {course && (
        <>
          <MyCourseHeader course={course} />

          <MyCourseProgress course={course} />

          <MyCourseSectionList courseId={courseId} sections={course.sections} />
        </>
      )}
    </ResourceState>
  );
}

export default MyCourseDetail;
