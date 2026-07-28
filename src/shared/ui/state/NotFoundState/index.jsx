import { Link } from "react-router-dom";

function NotFoundState({ action }) {
  return (
    <>
      <h2>Resource Not Found</h2>

      <p>
        The resource you are looking for does not exist or has been removed.
      </p>

      {action && <Link to={action.to}>{action.label}</Link>}
    </>
  );
}

export default NotFoundState;
