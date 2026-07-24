function NotFoundState({ action }) {
  return (
    <>
      <h2>Resource Not Found</h2>

      <p>
        The resource you are looking for does not exist or has been removed.
      </p>

      {action && <Link to="/">Go to home</Link>}
    </>
  );
}

export default NotFoundState;
