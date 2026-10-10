function ServerErrorState({ onRetry }) {
  return (
    <>
      <h2 lang="vi">Đã xảy ra lỗi</h2>

      <p lang="vi">Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau.</p>

      {onRetry && <button lang="vi" onClick={onRetry}>Thử lại</button>}
    </>
  );
}

export default ServerErrorState;
