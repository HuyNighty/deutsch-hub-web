import { useParams } from "react-router-dom";
import MyCourseHeader from "./components/MyCourseHeader";
import MyCourseProgress from "./components/MyCourseProgress";
import MyCourseSectionList from "./components/MyCourseSectionList";
import useMyCourseDetail from "./hooks/useMyCourseDetail";

function MyCourseDetail() {
  const { courseId } = useParams();

  const { course, loading, error } = useMyCourseDetail(courseId);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Something went wrong...</p>;
  }

  return (
    <>
      <MyCourseHeader course={course} />
      <MyCourseProgress course={course} />
      <MyCourseSectionList courseId={courseId} sections={course.sections} />
    </>
  );
}

export default MyCourseDetail;
