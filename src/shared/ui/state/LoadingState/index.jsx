function LoadingState({ children }) {
  if (children) {
    return children;
  }

  return <span lang="vi">Đang tải...</span>;
}

export default LoadingState;
