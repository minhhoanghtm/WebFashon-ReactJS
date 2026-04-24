import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { routes } from "./routes";

function AppContent() {
  const location = useLocation();
  
  // Routes that don't need header and footer
  const noLayoutRoutes = ["/login", "/register", "/reset-password", "/verify-otp", "/forgot-password"];
  const showLayout = !noLayoutRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 flex flex-col">
      {showLayout && <Header />}
      <main className="flex-1">
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>
      {showLayout && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
