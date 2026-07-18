import { Link } from "react-router-dom";

function MyCourseCard() {
  return (
    <>
      <h2>No enrolled courses</h2>

      <Link to="/learn-german">Browse Courses</Link>
    </>
  );
}

export default MyCourseCard;
