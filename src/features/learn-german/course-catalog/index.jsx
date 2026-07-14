import { useCourses } from "./hooks/useCourses";
import CourseList from "./components/CourseList";

export default function CourseCatalog() {
  const { courses, loading, error } = useCourses();

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Something went wrong.</p>;

  return (
    <>
      <h1>Course Catalog</h1>

      <CourseList courses={courses} />
    </>
  );
}
