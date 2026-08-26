import { QueryProvider } from "./app/providers";
import AppRouter from "./app/router";
import { AuthProvider } from "./features/auth/context/AuthProvider";

function App() {
  return (
    <>
      <AuthProvider>
        <QueryProvider>
          <AppRouter />
        </QueryProvider>
      </AuthProvider>
    </>
  );
}

export default App;
