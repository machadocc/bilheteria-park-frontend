import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./components/Layout";

// Páginas públicas
import Home from "./pages/Home";
import EventoCheckout from "./pages/EventoCheckout";
import AdminLogin from "./pages/AdminLogin";

// Páginas admin
import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Events from "./pages/Events";
import Batches from "./pages/Batches";
import Customers from "./pages/Customers";
import System from "./pages/System";

// Guard: redireciona para login se não estiver autenticado
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

// Wrapper para páginas admin com sidebar
function AdminPage({ children }) {
  return (
    <RequireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>            
            <Route path="/" element={<Home />} />
            <Route path="/evento/:eventoId" element={<EventoCheckout />} />
            <Route path="/admin/login" element={<AdminLoginRedirect />} />

            {/* ===== ROTAS ADMIN (autenticadas) ===== */}
            <Route path="/admin" element={<AdminPage><Dashboard /></AdminPage>} />
            <Route path="/admin/pdv" element={<AdminPage><PointOfSale /></AdminPage>} />
            <Route path="/admin/eventos" element={<AdminPage><Events /></AdminPage>} />
            <Route path="/admin/lotes" element={<AdminPage><Batches /></AdminPage>} />
            <Route path="/admin/clientes" element={<AdminPage><Customers /></AdminPage>} />
            <Route path="/admin/sistema" element={<AdminPage><System /></AdminPage>} />

            {/* Fallback: redireciona para home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

// Se já está logado, redireciona direto para o admin
function AdminLoginRedirect() {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <AdminLogin />;
}
