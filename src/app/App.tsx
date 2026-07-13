import { useState, useEffect } from "react";
import type { AppPage } from "../types";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";
import { useWorkout } from "../hooks/useWorkout";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { PerfilPage } from "../pages/PerfilPage";
import { EstatisticasPage } from "../pages/EstatisticasPage";
import { isAuthenticated, apiGetMe, clearToken } from "../utils/api";
import { clearUserName } from "../utils/storage";
import { useInactivity } from "../hooks/useInactivity";
import { useSessionLifecycle } from "../hooks/useSessionLifecycle";

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

  const {
    sessions,
    userName,
    loadingSession,
    pre, setPre,
    during, setDuring,
    post, setPost,
    handleSetUserName,
    startNewWorkout,
    saveSession,
    deleteSession,
    logout,
    deleteAccount,
    fetchSessions,
  } = useWorkout();

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
        navigate(setPage, { tag: "home" });
      })
      .catch(() => {
        // Token expirado ou inválido
        clearToken();
        navigate(setPage, { tag: "onboarding" });
      });
  }, []);

  const handleStartWorkout = () => {
    startNewWorkout();
    navigate(setPage, { tag: "workout", phase: "pre" });
  };

  const handleSaveAndNavigate = async () => {
    await saveSession();
    navigate(setPage, { tag: "history" });
  };

  const handleLogout = async () => {
    await logout(); // Hook gerencia limpeza e backend
    navigate(setPage, { tag: "onboarding" });
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate(setPage, { tag: "onboarding" });
  };

  useInactivity(handleLogout);
  useSessionLifecycle(); // Monitoriza fechamento de janela

  return (
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
          <EstatisticasPage sessions={sessions} userName={userName} />
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
  );
}