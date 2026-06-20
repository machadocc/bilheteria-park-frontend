import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./context/ToastContext";
import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Events from "./pages/Events";
import Batches from "./pages/Batches";
import Customers from "./pages/Customers";
import System from "./pages/System";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PointOfSale />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/lotes" element={<Batches />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/sistema" element={<System />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}
