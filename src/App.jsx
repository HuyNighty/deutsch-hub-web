import { QueryProvider } from "./app/providers";
import AppRouter from "./app/router";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { CatalogueThemeProvider } from "./app/providers/CatalogueThemeProvider";

function App() {
  return (
    <CatalogueThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryProvider>
    </CatalogueThemeProvider>
  );
}

export default App;
