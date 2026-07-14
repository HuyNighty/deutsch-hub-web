import { useParams } from "react-router-dom";

import { useCourseDetail } from "./hooks/useCourseDetail";

import CourseHeader from "./components/CourseHeader";
import CourseOverview from "./components/CourseOverview";
import CourseSectionList from "./components/CourseSectionList";

export default function CourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error } = useCourseDetail(courseId);

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Something went wrong.</p>;

  return (
    <>
      <CourseHeader course={course} />
      <CourseOverview description={course.description} />
      <CourseSectionList sections={course.sections} />
      <button>Enroll Course</button>
    </>
  );
}
