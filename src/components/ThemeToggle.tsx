import { Sun, Moon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

// Props para o componente ThemeToggle
export type Theme = "light" | "dark";

// Props para o componente ThemeToggle
interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          className="text-[#7a8099] hover:text-[#00e5ff] transition-colors p-2 rounded-lg"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}</span>
      </TooltipContent>
    </Tooltip>
  );
}