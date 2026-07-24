function LoadingState({ children }) {
  if (children) {
    return children;
  }

  return <>Loading...</>;
}

export default LoadingState;
