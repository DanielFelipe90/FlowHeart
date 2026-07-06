import { Home, History, User, LogOut } from "lucide-react";
import type { AppPage } from "../types";


interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  page: AppPage;
  setPage: (page: AppPage) => void;
  userName: string;
  onLogout: () => void; // adiciona
}

const navItems = [
  { tag: "home" as const, label: "Início", icon: Home },
  { tag: "history" as const, label: "Histórico", icon: History },
  { tag: "perfil" as const, label: "Perfil", icon: User },
];

export function Drawer({ isOpen, onClose, page, setPage, onLogout }: DrawerProps) {  const handleNavigate = (tag: AppPage["tag"]) => {
    setPage({ tag } as AppPage);
    onClose();
  };

  return (
    <>
      {/* Overlay escuro */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      {/* Painel lateral */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300"
        style={{
          width: "260px",
          background: "#161a23",
          borderRight: "1px solid rgba(0,229,255,0.08)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Itens de navegação */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navItems.map(({ tag, label, icon: Icon }) => {
            const isActive = page.tag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleNavigate(tag)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full ${
                  isActive
                    ? "bg-[rgba(0,229,255,0.08)] text-[#00e5ff]"
                    : "text-[#7a8099] hover:text-[#e8eaf0]"
                }`}
              >
                <Icon size={18} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#00e5ff" }}
                  />
                )}
              </button>
            );
          })}

          {/* Separador */}
          <div
            className="my-2 border-t"
            style={{ borderColor: "rgba(0,229,255,0.08)" }}
          />

          {/* Botão sair */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full text-[#ff3131] hover:bg-[#ff3131]/10"
          >
            <LogOut size={18} />
            <span
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}
            >
              Sair da conta
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}
