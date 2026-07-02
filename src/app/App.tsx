import { useState } from "react";
import type { AppPage } from "../types";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";
import { useWorkout } from "../hooks/useWorkout";

// ─── Helper de navegação ──────────────────────────────────────────────────────

/**
 * Navega para uma nova página aplicando a View Transitions API quando disponível.
 * O fallback garante compatibilidade com browsers que não suportam a API.
 * A animação (slide) é definida no index.css via ::view-transition-old/new.
 */
function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  if (!document.startViewTransition) {
    setPage(page);
    return;
  }
  document.startViewTransition(() => setPage(page));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function App() {

  // Estado de navegação — começa no onboarding
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });

  // Consome toda a lógica de negócio e persistência do hook
  const {
    sessions,
    userName,
    pre, setPre,
    during, setDuring,
    post, setPost,
    handleSetUserName,
    startNewWorkout,
    saveSession,
  } = useWorkout();

  /**
   * Inicia um novo treino: reseta os estados e navega para pré-treino.
   * A navegação fica no App pois é responsabilidade de roteamento,
   * não de lógica de negócio.
   */
  const handleStartWorkout = () => {
    startNewWorkout();
    navigate(setPage, { tag: "workout", phase: "pre" });
  };

  /**
   * Salva a sessão e navega para o histórico.
   * Separa o save (lógica) da navegação (roteamento).
   */
  const handleSaveAndNavigate = () => {
    saveSession();
    navigate(setPage, { tag: "history" });
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#0d0f14", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header: oculto no onboarding para dar foco ao formulário de boas-vindas */}
      {page.tag !== "onboarding" && (
        <Header page={page} setPage={(p) => navigate(setPage, p)} />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Onboarding: primeira visita ou sem nome salvo */}
        {page.tag === "onboarding" && (
          <OnboardingPage
            userName={userName}
            setUserName={handleSetUserName}
            setPage={(p) => navigate(setPage, p)}
          />
        )}

        {/* Home: resumo do último treino e acesso às ações principais */}
        {page.tag === "home" && (
          <HomePage
            userName={userName}
            sessions={sessions}
            setPage={(p) => navigate(setPage, p)}
            startNewWorkout={handleStartWorkout}
          />
        )}

        {/* Workout: fluxo de 3 fases (pré → durante → pós) */}
        {page.tag === "workout" && (
          <WorkoutPage
            phase={page.phase}
            pre={pre} setPre={setPre}
            during={during} setDuring={setDuring}
            post={post} setPost={setPost}
            setPage={(p) => navigate(setPage, p)}
            saveSession={handleSaveAndNavigate}
          />
        )}

        {/* History: lista de todas as sessões em ordem cronológica inversa */}
        {page.tag === "history" && (
          <HistoryPage
            sessions={sessions}
            setPage={(p) => navigate(setPage, p)}
          />
        )}

        {/* Detail: análise completa de uma sessão com gráficos */}
        {page.tag === "detail" && (
          <DetailPage
            session={page.session}
            onBack={() => navigate(setPage, { tag: "history" })}
          />
        )}

      </main>

      {/* Footer: visível apenas nas páginas iniciais */}
      {(page.tag === "onboarding" || page.tag === "home") && (
        <Footer />
      )}
    </div>
  );
}