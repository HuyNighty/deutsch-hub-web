import useMyLearning from "./hooks/useMyLearning";

import MyCourseCard from "./components/MyCourseCard";
import MyLearningEmpty from "./components/MyLearningEmpty";

function MyLearningPage() {
  const { courses, loading, error } = useMyLearning();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Something went wrong.</p>;
  }

  if (courses.length === 0) {
    return <MyLearningEmpty />;
  }

  return (
    <>
      <h1>My Learning</h1>

      {courses.map((course) => (
        <MyCourseCard key={course.id} course={course} />
      ))}
    </>
  );
}

export default MyLearningPage;
