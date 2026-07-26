import { QueryProvider } from "./app/providers";
import AppRouter from "./app/router";

function App() {
  return (
    <>
      <QueryProvider>
        <AppRouter />
      </QueryProvider>
    </>
  );
}

export default App;
