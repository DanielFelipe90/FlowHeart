import { useState } from "react";
import { Menu } from "lucide-react";
import { Drawer } from "./Drawer";
import type { AppPage } from "../types";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

// Props para o componente Header
interface HeaderProps {
  page: AppPage;
  setPage: (page: AppPage) => void;
  userName: string;
  onLogout: () => void;
}

export function Header({ page, setPage, userName, onLogout }: HeaderProps) {

  // Estado para controlar se o drawer (menu lateral) está aberto ou fechado
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border px-4 py-4 flex items-center justify-between max-w-lg mx-auto bg-background">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="FlowHeart" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}
              className="text-foreground">
              FLOW<span className="text-accent">HEART</span>
            </p>
            <p className="text-muted-foreground" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>
              BIKE TRAINING TRACKER
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary"
            >
              <Menu size={22} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Menu</span>
          </TooltipContent>
        </Tooltip>
      </header>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        page={page}
        setPage={setPage}
        userName={userName}
        onLogout={onLogout}
      />
    </>
  );
}