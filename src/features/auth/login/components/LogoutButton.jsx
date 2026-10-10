import { Button } from "@/shared/ui/components/button";
import useLogout from "../../hooks/useLogout";

export default function LogoutButton() {
  const { handleLogout } = useLogout();

  return <Button lang="vi" onClick={handleLogout}>Đăng xuất</Button>;
}
