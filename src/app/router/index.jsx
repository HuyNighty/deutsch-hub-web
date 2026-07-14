import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
