import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import { getAuthStatus, logout as logoutApi } from "./api/auth";

const List = lazy(() => import("./pages/List"));
const New = lazy(() => import("./pages/New"));
const Excursio = lazy(() => import("./pages/Excursio"));
const Mapa = lazy(() => import("./pages/Mapa"));
const Fita = lazy(() => import("./pages/Fita"));

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getAuthStatus().then(setIsAuthenticated);
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Layout>
        <Header
          isAuthenticated={isAuthenticated}
          onLoginClick={() => setIsLoginOpen(true)}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<div className="p-4 text-black">Carregant...</div>}>
          <Routes>
            <Route path="/" element={<List isAuthenticated={isAuthenticated} />} />
            <Route path="/nou" element={<New isAuthenticated={isAuthenticated} />} />
            <Route path="/mapa" element={<Mapa isAuthenticated={isAuthenticated} />} />
            <Route path="/excursions/:slug" element={<Excursio isAuthenticated={isAuthenticated} />} />
            <Route path="/fita/:id" element={<Fita isAuthenticated={isAuthenticated} />} />
          </Routes>
        </Suspense>
      </Layout>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={async () => {
          setIsLoginOpen(false);
          const authenticated = await getAuthStatus();
          setIsAuthenticated(authenticated);
          if (authenticated) {
            window.location.reload();
          }
        }}
      />
    </BrowserRouter>
  );
}
