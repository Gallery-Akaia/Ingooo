import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import AdminPanel from "@/pages/AdminPanel";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthHandler() {
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if URL has session_id in fragment
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const sessionId = params.get('session_id');

      if (sessionId) {
        try {
          // Exchange session_id for session
          await axios.post(
            `${API}/auth/session`,
            {},
            {
              headers: { 'X-Session-ID': sessionId },
              withCredentials: true
            }
          );

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Reload to update auth state
          window.location.reload();
        } catch (error) {
          console.error('Auth error:', error);
        }
      }
    };

    handleAuthCallback();
  }, [location]);

  return null;
}

function App() {
  return (
    <CartProvider>
      <div className="App">
        <BrowserRouter>
          <AuthHandler />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </CartProvider>
  );
}

export default App;
