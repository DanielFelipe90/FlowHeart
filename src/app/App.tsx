import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import type { AppPage } from "../types";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InactivityModal } from "../components/InactivityModal";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";
import { useWorkout } from "../hooks/useWorkout";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { PerfilPage } from "../pages/PerfilPage";
import { isAuthenticated, apiGetMe, clearToken } from "../utils/api";
import { useInactivity } from "../hooks/useInactivity";
import { useSessionLifecycle } from "../hooks/useSessionLifecycle";

// Lazy: EstatisticasPage puxa o recharts, a dependência mais pesada do bundle.
// Só carrega o chunk quando o usuário realmente navega até essa página.
const EstatisticasPage = lazy(() =>
  import("../pages/EstatisticasPage").then((m) => ({ default: m.EstatisticasPage }))
);

// ─── Helper de navegação ──────────────────────────────────────────────────────

function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  if (!document.startViewTransition) {
    setPage(page);
    return;
  }
  document.startViewTransition(() => setPage(page));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });
  const [userId, setUserId] = useState<string | null>(null);


  const {
    sessions, userName, pre, setPre, during, setDuring, post, setPost,
    handleSetUserName, startNewWorkout, saveSession, deleteSession, logout,
    deleteAccount
  } = useWorkout();

  const isLoggedIn = !!userName;

  /**
   * Ao iniciar o app verifica se há token válido salvo.
   * Se sim, busca o usuário na API e vai direto para home.
   * Se o token estiver expirado (401), redireciona para login.
   */
  useEffect(() => {
    if (!isAuthenticated()) return;

    apiGetMe()
      .then(async (user) => {
        handleSetUserName(user.name);
        setUserId(user.id);
        navigate(setPage, { tag: "home" });
      })
      .catch(() => {
        // Token expirado ou inválido
        clearToken();
        navigate(setPage, { tag: "onboarding" });
      });
  }, []);

  // Função para iniciar um novo treino e navegar para a fase "pre"
  const handleStartWorkout = () => {
    startNewWorkout();
    navigate(setPage, { tag: "workout", phase: "pre" });
  };

  // Função para salvar a sessão de treino e navegar para a página de histórico
  const handleSaveAndNavigate = async () => {
    await saveSession();
    navigate(setPage, { tag: "history" });
  };

  // Função para lidar com logout, incluindo limpeza de token, histórico do navegador e transição visual para a página de onboarding
  const handleLogout = useCallback(async () => {
    await logout();
    window.history.replaceState(null, "", "/onboarding");
    navigate(setPage, { tag: "onboarding" });
  }, [logout, setPage]);

  // Função para lidar com a exclusão da conta do usuário, incluindo navegação para a página de onboarding após a exclusão
  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate(setPage, { tag: "onboarding" });
  };

  // Hook customizado para monitorar o ciclo de vida da sessão, incluindo eventos de fechamento da janela
  useSessionLifecycle();

  const isWorkoutActive = page.tag === "workout";

  // Hook customizado para lidar com inatividade do usuário, mostrando um modal de aviso e permitindo que o usuário continue logado
  const { showModal, setShowModal, resetInactivity } = useInactivity(
    handleLogout,
    isLoggedIn,
    userId,
    isWorkoutActive
  );
  // Função para lidar com a ação de "continuar logado" no modal de inatividade, fechando o modal e resetando o temporizador de inatividade
  const handleKeepAlive = () => {
    setShowModal(false);
    resetInactivity();
  };

  return (

    <>

      {/** Renderiza o modal de inatividade apenas se o usuário estiver logado e o modal estiver visível */}
      {isLoggedIn && (
        <InactivityModal isOpen={showModal} onKeepAlive={handleKeepAlive} />
      )}

      <div
        className="min-h-screen w-full bg-background select-none"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {page.tag !== "onboarding" &&
          page.tag !== "register" &&
          page.tag !== "login" && (
            <Header
              page={page}
              setPage={(p) => navigate(setPage, p)}
              userName={userName}
              onLogout={handleLogout}
            />
          )}

        <main className="max-w-lg mx-auto px-4 py-6">

          {page.tag === "onboarding" && (
            <OnboardingPage setPage={(p) => navigate(setPage, p)} />
          )}

          {page.tag === "register" && (
            <RegisterPage
              setUserName={handleSetUserName}
              setPage={(p) => navigate(setPage, p)}
              onBack={() => navigate(setPage, { tag: "onboarding" })}
            />
          )}

          {page.tag === "login" && (
            <LoginPage
              setUserName={handleSetUserName}
              setPage={(p) => navigate(setPage, p)}
              onBack={() => navigate(setPage, { tag: "onboarding" })}
            />
          )}

          {page.tag === "home" && (
            <HomePage
              userName={userName}
              sessions={sessions}
              setPage={(p) => navigate(setPage, p)}
              startNewWorkout={handleStartWorkout}
            />
          )}

          {page.tag === "workout" && (
            <WorkoutPage
              phase={page.phase}
              pre={pre} setPre={setPre}
              during={during} setDuring={setDuring}
              post={post} setPost={setPost}
              setPage={(p) => navigate(setPage, p)}
              saveSession={handleSaveAndNavigate}
              resetInactivity={resetInactivity}
              userId={userId}
            />
          )}

          {page.tag === "history" && (
            <HistoryPage
              sessions={sessions}
              setPage={(p) => navigate(setPage, p)}
              onBack={() => navigate(setPage, { tag: "home" })}
              onDelete={deleteSession}
            />
          )}

          {page.tag === "detail" && (
            <DetailPage
              session={page.session}
              onBack={() => navigate(setPage, { tag: "history" })}
            />
          )}

          {page.tag === "estatisticas" && (
            <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Carregando estatísticas…</div>}>
              <EstatisticasPage sessions={sessions} userName={userName} />
            </Suspense>
          )}

          {page.tag === "perfil" && (
            <PerfilPage
              userName={userName}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

        </main>

        {(page.tag === "onboarding" ||
          page.tag === "home" ||
          page.tag === "register" ||
          page.tag === "login" ||
          page.tag === "perfil") && <Footer />}
      </div>
    </>
  );
}