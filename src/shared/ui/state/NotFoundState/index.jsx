import { AppLink } from "../../components/app-link";

function NotFoundState({ action }) {
  return (
    <>
      <h2>Resource Not Found</h2>

      <p>
        The resource you are looking for does not exist or has been removed.
      </p>

      {action && <AppLink to={action.to}>{action.label}</AppLink>}
    </>
  );
}

export default NotFoundState;
