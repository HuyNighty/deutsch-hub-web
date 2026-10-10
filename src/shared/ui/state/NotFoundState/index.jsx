import { AppLink } from "../../components/app-link";

function NotFoundState({ action }) {
  return (
    <>
      <h2 lang="vi">Không tìm thấy tài nguyên</h2>

      <p lang="vi">
        Tài nguyên bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
      </p>

      {action && <AppLink to={action.to}>{action.label}</AppLink>}
    </>
  );
}

export default NotFoundState;
