import { useCourses } from "./hooks/useCourses";
import CourseList from "./components/CourseList";
import ResourceState from "@/shared/ui/state/ResourceState";

export default function CourseCatalog() {
  const { courses, loading, error } = useCourses();

  return (
    <ResourceState
      loading={loading}
      error={error}
      empty={courses.length === 0}
      emptyProps={{
        title: "No courses found",
        description: "There are no available courses at the moment.",
      }}
    >
      <>
        <h1>Course Catalog</h1>

        <CourseList courses={courses} />
      </>
    </ResourceState>
  );
}
