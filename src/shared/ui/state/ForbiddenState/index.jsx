import { Link } from "react-router-dom";

function ForbiddenState({ action }) {
  return (
    <>
      <h2>Access Denied</h2>

      <p>You don't have permission to access this resource.</p>

      {action && <Link to={action.to}>{action.label}</Link>}
    </>
  );
}

export default ForbiddenState;
