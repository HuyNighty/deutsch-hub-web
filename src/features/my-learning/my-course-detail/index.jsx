import MyCourseDetail from "@/features/my-learning/my-course-detail";
import { useParams } from "react-router-dom";
import useMyCourseDetail from "./hooks/useMyCourseDetail";
import MyCourseHeader from "./components/MyCourseHeader";
import MyCourseProgress from "./components/MyCourseProgress";
import MyCourseSectionList from "./components/MyCourseSectionList";

export default function MyCourseDetailPage() {
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
