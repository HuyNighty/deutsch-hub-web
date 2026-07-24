import EmptyState from "../EmptyState";
import ErrorState from "../ErrorState";
import LoadingState from "../LoadingState";

function ResourceState({
  loading = false,
  error = null,
  empty = false,
  children,
  loadingProps = {},
  emptyProps = {},
  errorProps = {},
}) {
  if (loading) {
    return <LoadingState {...loadingProps} />;
  }

  if (error) {
    return <ErrorState error={error} {...errorProps} />;
  }

  if (empty) {
    return <EmptyState {...emptyProps} />;
  }

  return children;
}
