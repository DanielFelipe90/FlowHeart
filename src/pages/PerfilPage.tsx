import { useMemo, useState } from "react";
import { DeleteAccount } from "../components/DeleteAccount";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

// Props para o componente PerfilPage
interface PerfilPageProps {
  userName: string;
  onDeleteAccount: () => void;
}

// Cores para o avatar, escolhidas com base na primeira letra do nome do usuário
const AVATAR_COLORS = [
  "#00e5ff", "#ff3131", "#ff5733", "#39ff14",
  "#ff5c00", "#7c3aed", "#0ea5e9", "#f59e0b",
];

export function PerfilPage({ userName, onDeleteAccount }: PerfilPageProps) {
  const { theme, toggleTheme } = useTheme();

  // Estado inicial lido direto da API do navegador (sem pedir nada ainda).
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => (("Notification" in window) ? Notification.permission : "unsupported"));

  // Calcula a cor do avatar com base na primeira letra do nome do usuário
  const avatarColor = useMemo(() => {
    const index = userName.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, [userName]);

  // Calcula as iniciais do usuário para exibir no avatar
  const initials = userName.slice(0, 2).toUpperCase();

  // Função para solicitar permissão de notificações
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }

    // Se já foi negada antes, o navegador NÃO mostra o diálogo de novo —
    // requestPermission() só devolve "denied" na hora, sem UI nenhuma.
    // Avisamos o usuário de que precisa liberar manualmente nas
    // configurações do site, senão o clique parece não fazer nada.
    if (Notification.permission === "denied") {
      alert(
        "As notificações estão bloqueadas para este site. Para ativar, abra as configurações do navegador (ícone de cadeado/informações ao lado da URL) e permita notificações para este endereço."
      );
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      alert("Notificações ativadas com sucesso!");
    } else if (permission === "denied") {
      alert("Permissão negada. Você pode ativar depois nas configurações do navegador.");
    }
    // "default" (usuário fechou o diálogo sem escolher) — sem alerta,
    // já que o próximo clique mostra o diálogo de novo normalmente.
  };

  const notificationButtonLabel =
    notificationPermission === "granted"
      ? "Notificações Ativadas"
      : notificationPermission === "denied"
      ? "Notificações Bloqueadas"
      : "Ativar Notificações";

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
          disabled={notificationPermission === "granted"}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-default"
        >
          {notificationButtonLabel}
        </button>
      </div>


      <DeleteAccount onDelete={onDeleteAccount} />
    </div>
  );
}