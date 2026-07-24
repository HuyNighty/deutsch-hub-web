function NetworkErrorState({ onRetry }) {
  return (
    <>
      <h2>Connection Error</h2>

      <p>
        Unable to connect to the server. Please check your internet connection.
      </p>

      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </>
  );
}

export default NetworkErrorState;
