import useLogout from "../../hooks/useLogout";

export default function LogoutButton() {
  const { handleLogout } = useLogout();

  return <button onClick={handleLogout}>Logout</button>;
}
