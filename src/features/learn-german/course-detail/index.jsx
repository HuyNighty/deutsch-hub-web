import { useParams } from "react-router-dom";

import { useCourseDetail } from "./hooks/useCourseDetail";

import CourseHeader from "./components/CourseHeader";
import CourseOverview from "./components/CourseOverview";
import CourseSectionList from "./components/CourseSectionList";
import CourseAction from "./components/CourseAction";
import ResourceState from "@/shared/ui/state/ResourceState";

export default function CourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error } = useCourseDetail(courseId);

  return (
    <ResourceState loading={loading} error={error}>
      <>
        <CourseHeader course={course} />

        <CourseOverview course={course} />

        <CourseSectionList sections={course.sections} />

        <CourseAction
          courseId={course.id}
          enrollmentStatus={course.enrollmentStatus}
        />
      </>
    </ResourceState>
  );
}
