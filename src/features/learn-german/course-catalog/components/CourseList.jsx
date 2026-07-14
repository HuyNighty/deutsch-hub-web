import CourseItem from "./CourseItem";

export default function CourseList({ courses }) {
  return (
    <ul>
      {courses.map((course) => (
        <CourseItem key={course.id} course={course} />
      ))}
    </ul>
  );
}
