import type { AppPage } from "../types";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

interface OnboardingPageProps {
  setPage: (page: AppPage) => void;
}

export function OnboardingPage({ setPage }: OnboardingPageProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col justify-center min-h-[70vh]">

      {/* Botão de tema no canto superior esquerdo */}
      <div className="flex justify-end m-4">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="flex flex-col items-center gap-6 m-4">
        <img src="/icon.png" alt="FlowHeart" className="w-30 h-30 rounded-lg object-contain" />
      </div>

      <div className="mb-8">
        <h1
          className="text-foreground"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.05 }}
        >
          BEM-VINDO AO<br />
          <span className="text-primary">FLOW</span>
          <span className="text-destructive">HEART</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Seu tracker de treino de ciclismo com monitoramento cardíaco.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setPage({ tag: "register" })}
          className="w-full rounded-xl py-4 flex items-center justify-center transition-all hover:opacity-90 bg-primary text-primary-foreground"
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            REGISTRAR
          </span>
        </button>

        <button
          onClick={() => setPage({ tag: "login" })}
          className="w-full rounded-xl py-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            ENTRAR
          </span>
        </button>
      </div>
    </div>
  );
}