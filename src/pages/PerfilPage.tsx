import { useMemo } from "react";
import { DeleteAccount } from "../components/DeleteAccount";

interface PerfilPageProps {
  userName: string;
  onDeleteAccount: () => void;
}

const AVATAR_COLORS = [
  "#00e5ff", "#ff3131", "#ff5733", "#39ff14",
  "#ff5c00", "#7c3aed", "#0ea5e9", "#f59e0b",
];

export function PerfilPage({ userName, onDeleteAccount }: PerfilPageProps) {
  const avatarColor = useMemo(() => {
    const index = userName.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, [userName]);

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 flex flex-col min-h-[70vh]">
      <div className="space-y-4 flex flex-col items-center mb-8">
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "#e8eaf0",
            lineHeight: 1.05,
          }}
        >
          Perfil
        </h1>
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
        <span className="text-[#ffffff]">
          {userName.toUpperCase()}
        </span>
      </div>

      <DeleteAccount onDelete={onDeleteAccount} />
    </div>
  );
}