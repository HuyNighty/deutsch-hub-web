import LogoutButton from "@/features/auth/login/components/LogoutButton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Link } from "react-router-dom";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <h1>DeutschHub</h1>

      <nav>
        <ul>
          <li>
            <Link to="/learn-german">Learn German</Link>
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

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/my-learning">My Learning</Link>
              </li>

              <li>
                <Link to="/account">Account</Link>
              </li>

              <li>
                <LogoutButton />
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>

              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
