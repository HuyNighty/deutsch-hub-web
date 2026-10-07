import { QueryProvider } from "./app/providers";
import AppRouter from "./app/router";
import { AuthProvider } from "./features/auth/context/AuthProvider";

function App() {
  return (
    <>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryProvider>
    </>
  );
}

export default App;
