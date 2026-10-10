import { AppLink } from "../../components/app-link";

function ForbiddenState({ action }) {
  return (
    <>
      <h2 lang="vi">Không có quyền truy cập</h2>

      <p lang="vi">Bạn không có quyền truy cập tài nguyên này.</p>

      {action && <AppLink to={action.to}>{action.label}</AppLink>}
    </>
  );
}

export default ForbiddenState;
