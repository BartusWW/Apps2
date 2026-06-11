import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Log from "@/pages/Log";
import Review from "@/pages/Review";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="log" element={<Log />} />
              <Route path="review" element={<Review />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster
          theme="dark"
          position="top-center"
          richColors={false}
          toastOptions={{
            className: "!bg-neutral-900 !border !border-white/10 !text-white",
          }}
        />
      </AppProvider>
    </div>
  );
}

export default App;
