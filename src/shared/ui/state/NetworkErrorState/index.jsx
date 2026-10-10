function NetworkErrorState({ onRetry }) {
  return (
    <>
      <h2 lang="vi">Lỗi kết nối</h2>

      <p lang="vi">
        Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.
      </p>

      {onRetry && <button lang="vi" onClick={onRetry}>Thử lại</button>}
    </>
  );
}

export default NetworkErrorState;
