function RoleRoute({ roles }) {
  const { user } = useAuth();

  if (!roles.includes(user.role)) {
    return <ForbiddenState />;
  }

  return <Outlet />;
}

export default RoleRoute;
