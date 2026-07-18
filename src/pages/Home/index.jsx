import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>DeutschHub</h1>

      <nav>
        <ul>
          <li>
            <Link to="/learn-german">Learn German</Link>
          </li>

          <li>
            <Link to="/my-learning">My Learning</Link>
          </li>

          <li>
            <Link to="/explore-germany">Explore Germany</Link>
          </li>

          <li>
            <Link to="/study-in-germany">Study in Germany</Link>
          </li>

          <li>
            <Link to="/experiences">Experiences</Link>
          </li>

          <li>
            <Link to="/account">Account</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
