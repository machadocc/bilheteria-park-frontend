import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const NAV = [
  { group: "Operação", items: [
    { to: "/admin", label: "Painel", icon: "dashboard", end: true, title: "Painel", eyebrow: "Visão geral" },
    { to: "/admin/pdv", label: "Ponto de venda", icon: "store", title: "Ponto de venda", eyebrow: "Vender ingressos" },
  ]},
  { group: "Cadastros", items: [
    { to: "/admin/eventos", label: "Eventos", icon: "calendar", title: "Eventos", eyebrow: "Gestão de eventos" },
    { to: "/admin/lotes", label: "Lotes", icon: "layers", title: "Lotes de ingressos", eyebrow: "Preços e estoque" },
    { to: "/admin/clientes", label: "Clientes", icon: "users", title: "Clientes", eyebrow: "Base de clientes" },
  ]},
  { group: "Infra", items: [
    { to: "/admin/sistema", label: "Sistema", icon: "settings", title: "Sistema", eyebrow: "Conexão e status" },
  ]},
];

const FLAT = NAV.flatMap((g) => g.items);

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const current =
    FLAT.find((i) => i.end ? pathname === i.to : pathname.startsWith(i.to)) ||
    FLAT[0];

  function handleLogout() {
    logout();
    toast.success("Sessão encerrada.");
    navigate("/admin/login");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="ticket" size={22} /></div>
          <div>
            <div className="brand-name">Bilheteria Park</div>
            <div className="brand-sub">Administração</div>
          </div>
        </div>

        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-group-label">{g.group}</div>
            {g.items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon name={i.icon} className="ico" />
                <span>{i.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div style={{ color: "rgba(251,246,236,.6)", fontSize: 12 }}>
            {user?.username || "Admin"}
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              color: "rgba(251,246,236,.45)",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="x" size={12} /> Sair
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">{current?.eyebrow}</div>
            <h1>{current?.title}</h1>
          </div>
          <a href="/" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>
            <Icon name="arrow-left" size={14} /> Ver site público
          </a>
        </div>
        {children}
      </main>
    </div>
  );
}
