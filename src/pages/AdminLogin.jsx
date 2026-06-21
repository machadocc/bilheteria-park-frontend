import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/newEndpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Icon } from "../components/Icon";
import { pick } from "../components/ui";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      toast.error("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const token = pick(res, "access_token", "token");

      if (!token) {
        throw new Error("Token não retornado pelo servidor.");
      }

      login({ username }, token);
      toast.success("Login realizado com sucesso!");
      navigate("/admin");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <h1 style={{ fontSize: 24, margin: "0 0 8px 0" }}>Área Administrativa</h1>
            <p style={{ color: "#999", margin: 0 }}>Bilheteria Park</p>
          </div>

          <div className="field">
            <label>Usuário</label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleLogin}
            disabled={loading}
          >
            <Icon name="lock" size={16} /> {loading ? "Entrando…" : "Entrar"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#999" }}>
            <a href="/" style={{ color: "var(--red)", textDecoration: "none" }}>
              ← Voltar para compra de ingressos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
