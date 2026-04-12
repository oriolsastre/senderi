import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import List from "./pages/List";
import Excursio from "./pages/Excursio";
import New from "./pages/New";
import { getAuthStatus, logout as logoutApi } from "./api/auth";

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
        <Routes>
          <Route path="/" element={<List isAuthenticated={isAuthenticated} />} />
          <Route path="/nou" element={<New isAuthenticated={isAuthenticated} />} />
          <Route path="/excursions/:slug" element={<Excursio isAuthenticated={isAuthenticated} />} />
        </Routes>
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
