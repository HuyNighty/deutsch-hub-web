function EmptyState({ title, description, action }) {
  return (
    <>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </>
  );
}

export default EmptyState;
