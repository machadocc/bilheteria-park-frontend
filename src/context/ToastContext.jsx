import { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "../components/Icon";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const api = {
    success: (m) => push(m, "ok"),
    error: (m) => push(m, "err"),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === "ok" ? "check" : "alert"} size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
