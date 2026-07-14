import { useState } from "react";
import { Home, History, User, LogOut, BarChart2 } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import type { AppPage } from "../types";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  page: AppPage;
  setPage: (page: AppPage) => void;
  userName: string;
  onLogout: () => void;
}

const navItems = [
  { tag: "home" as const, label: "Início", icon: Home },
  { tag: "history" as const, label: "Histórico", icon: History },
  { tag: "estatisticas" as const, label: "Estatísticas", icon: BarChart2 },
  { tag: "perfil" as const, label: "Perfil", icon: User },
];

export function Drawer({ isOpen, onClose, page, setPage, onLogout }: DrawerProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleNavigate = (tag: AppPage["tag"]) => {
    setPage({ tag } as AppPage);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 bg-card border-l border-border"
        style={{
          width: "260px",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navItems.map(({ tag, label, icon: Icon }) => {
            const isActive = page.tag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleNavigate(tag)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary"
                  }`}
              >
                <Icon size={18} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}>
                  {label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}

          <div className="my-2 border-t border-border" />

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut size={18} />
            <span>Sair da conta</span>
          </button>
        </nav>
      </div>

      {showLogoutModal && (
        <ConfirmModal
          title="Sair da conta"
          message="Tem certeza que deseja sair? Você precisará realizar o login novamente."
          confirmLabel="Sair"
          danger={true}
          onConfirm={onLogout}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}