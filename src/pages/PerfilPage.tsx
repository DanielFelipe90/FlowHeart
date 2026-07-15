import { useMemo } from "react";
import { DeleteAccount } from "../components/DeleteAccount";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

interface PerfilPageProps {
  userName: string;
  onDeleteAccount: () => void;
}

const AVATAR_COLORS = [
  "#00e5ff", "#ff3131", "#ff5733", "#39ff14",
  "#ff5c00", "#7c3aed", "#0ea5e9", "#f59e0b",
];

export function PerfilPage({ userName, onDeleteAccount }: PerfilPageProps) {
  const { theme, toggleTheme } = useTheme();

  const avatarColor = useMemo(() => {
    const index = userName.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, [userName]);

  const initials = userName.slice(0, 2).toUpperCase();

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      alert("Notificações ativadas com sucesso!");
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[70vh]">
      <div className="space-y-4 flex flex-col items-center mb-8">

        {/* Cabeçalho com título e botão de tema */}
        <div className="flex items-center justify-between w-full">
          <h1
            className="text-foreground"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "2.5rem",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            Perfil
          </h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        {/* Avatar */}
        <div
          className="flex justify-center items-center w-30 h-30 rounded-full mt-4"
          style={{ background: avatarColor }}
        >
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "4rem",
            fontWeight: 500,
            color: "#000000",
            lineHeight: 1.05,
          }}>
            {initials}
          </p>
        </div>

        <span className="text-foreground font-semibold">
          {userName.toUpperCase()}
        </span>

        <button
          onClick={requestNotificationPermission}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Ativar Notificações
        </button>
      </div>


      <DeleteAccount onDelete={onDeleteAccount} />
    </div>
  );
}