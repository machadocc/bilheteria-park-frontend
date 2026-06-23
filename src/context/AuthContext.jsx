import { createContext, useState, useContext, useEffect } from "react";
import { setAuthToken, clearAuthToken } from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [user, setUser] = useState(null);
  const isAdmin = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("auth_token");
      clearAuthToken();
      setUser(null);
    }
  }, [token]);

  // Restore token on mount (e.g. page reload)
  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (saved) {
      setAuthToken(saved);
    }
  }, []);

  function login(adminUser, accessToken) {
    setUser(adminUser);
    setToken(accessToken);
    setAuthToken(accessToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    clearAuthToken();
  }

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
