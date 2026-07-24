import ForbiddenState from "../ForbiddenState";
import NetworkErrorState from "../NetworkErrorState";
import NotFoundState from "../NotFoundState";
import ServerErrorState from "../ServerErrorState";

function ErrorState({ error, onRetry, actions = {} }) {
  if (!error) {
    return null;
  }

  if (error.code === "ERR_NETWORK") {
    return <NetworkErrorState onRetry={onRetry} />;
  }

  switch (error.status) {
    case 403:
      return <ForbiddenState action={actions.forbidden} />;

    case 404:
      return <NotFoundState action={actions.notFound} />;

    default:
      return <ServerErrorState onRetry={onRetry} />;
  }
}

export default ErrorState;
