function ServerErrorState({ onRetry }) {
  return (
    <>
      <h2>Something went wrong</h2>

      <p>An unexpected server error occurred. Please try again later.</p>

      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </>
  );
}

export default ServerErrorState;
