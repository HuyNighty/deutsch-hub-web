import { AppLink } from "../../components/app-link";

function ForbiddenState({ action }) {
  return (
    <>
      <h2>Access Denied</h2>

      <p>You don't have permission to access this resource.</p>

      {action && <AppLink to={action.to}>{action.label}</AppLink>}
    </>
  );
}

export default ForbiddenState;
