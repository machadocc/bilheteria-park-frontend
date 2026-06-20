import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./Icon";

const NAV = [
  { group: "Operação", items: [
    { to: "/", label: "Painel", icon: "dashboard", end: true, title: "Painel", eyebrow: "Visão geral" },
    { to: "/pdv", label: "Ponto de venda", icon: "store", title: "Ponto de venda", eyebrow: "Vender ingressos" },
  ]},
  { group: "Cadastros", items: [
    { to: "/eventos", label: "Eventos", icon: "calendar", title: "Eventos", eyebrow: "Gestão de eventos" },
    { to: "/lotes", label: "Lotes", icon: "layers", title: "Lotes de ingressos", eyebrow: "Preços e estoque" },
    { to: "/clientes", label: "Clientes", icon: "users", title: "Clientes", eyebrow: "Base de clientes" },
  ]},
  { group: "Infra", items: [
    { to: "/sistema", label: "Sistema", icon: "settings", title: "Sistema", eyebrow: "Conexão e status" },
  ]},
];

const FLAT = NAV.flatMap((g) => g.items);

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const current = FLAT.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to) && i.to !== "/")) ||
    (pathname === "/" ? FLAT[0] : FLAT[0]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="ticket" size={22} className="" /></div>
          <div>
            <div className="brand-name">Bilheteria Park</div>
            <div className="brand-sub">Gestão</div>
          </div>
        </div>

        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-group-label">{g.group}</div>
            {g.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Icon name={i.icon} className="ico" />
                <span>{i.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div style={{ color: "rgba(251,246,236,.5)" }}>Parque de Diversões</div>
          <div style={{ color: "rgba(251,246,236,.35)", marginTop: 2 }}>v1.0 · API REST</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">{current?.eyebrow}</div>
            <h1>{current?.title}</h1>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
