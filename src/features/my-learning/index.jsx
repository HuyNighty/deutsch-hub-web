import ResourceState from "@/shared/ui/state/ResourceState";
import MyCourseCard from "./components/MyCourseCard";
import useMyLearning from "./hooks/useMyLearning";

function MyLearning() {
  const { courses, loading, error } = useMyLearning();

  return (
    <ResourceState
      loading={loading}
      error={error}
      empty={courses.length === 0}
      emptyProps={{
        title: "No courses yet",
        description: "Start learning your first course.",
      }}
    >
      <>
        <h1>My Learning</h1>

        {courses.map((course) => (
          <MyCourseCard key={course.id} course={course} />
        ))}
      </>
    </ResourceState>
  );
}

export default MyLearning;
