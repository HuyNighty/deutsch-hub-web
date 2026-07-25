export default function MyCourseHeader({ course }) {
  return (
    <>
      <h1>{course.title}</h1>

      <p>{course.description}</p>
    </>
  );
}
