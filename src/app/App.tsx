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
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { PerfilPage } from "../pages/PerfilPage";
import { isAuthenticated, apiGetMe, clearToken, apiFetch } from "../utils/api";
import { useWorkout } from "../hooks/useWorkout";
import { useInactivity } from "../hooks/useInactivity";
import { useUserPresence } from "../hooks/useUserPresence";
import { useSessionLifecycle } from "../hooks/useSessionLifecycle";

const EstatisticasPage = lazy(() =>
  import("../pages/EstatisticasPage").then((m) => ({ default: m.EstatisticasPage }))
);

function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  if (!document.startViewTransition) {
    setPage(page);
    return;
  }
  document.startViewTransition(() => setPage(page));
}

export default function App() {
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Verifica login diretamente pela API antes de chamar os hooks
  const isLoggedIn = isAuthenticated();

  // Hook central — Passamos a trava de autenticação como argumento
  const { userName, ...workout } = useWorkout(!isAuthChecking && isLoggedIn);

  const {
    sessions, pre, setPre, during, setDuring, post, setPost,
    handleSetUserName, startNewWorkout, saveSession, deleteSession, logout,
    deleteAccount, fetchSessions
  } = workout;

  useEffect(() => {
    if (!isLoggedIn) {
      setIsAuthChecking(false);
      return;
    }

    apiGetMe()
      .then(async (user) => {
        handleSetUserName(user.name);
        setUserId(user.id);
        await fetchSessions();

        if (page.tag === "onboarding") {
          navigate(setPage, { tag: "home" });
        }
      })
      .catch(() => {
        clearToken();
        // Opcional: navigate(setPage, { tag: "onboarding" });
      })
      .finally(() => setIsAuthChecking(false));
  }, [fetchSessions, isLoggedIn, page.tag]);

  const handleAuthSuccess = useCallback(async (): Promise<boolean> => {
    try {
      const user = await apiGetMe();
      handleSetUserName(user.name);
      setUserId(user.id);
      return true;
    } catch {
      clearToken();
      navigate(setPage, { tag: "onboarding" });
      return false;
    }
  }, [handleSetUserName]);

  const handleStartWorkout = () => {
    startNewWorkout();
    navigate(setPage, { tag: "workout", phase: "pre" });
  };

  const handleSaveAndNavigate = async () => {
    setIsTimerRunning(false);
    await saveSession();
    navigate(setPage, { tag: "history" });
  };

  // Marca offline via backend antes de deslogar — sem depender do Supabase diretamente
  const handleLogout = useCallback(async () => {
    try {
      await apiFetch("/auth/offline", { method: "POST" });
    } catch {
      // ignora erro — o cron de limpeza vai marcar offline em até 5 min
    }
    await logout();
    window.history.replaceState(null, "", "/onboarding");
    navigate(setPage, { tag: "onboarding" });
  }, [logout, setPage]);

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate(setPage, { tag: "onboarding" });
  };

  const isWorkoutActive = isTimerRunning || page.tag === "onboarding";

  const { showModal, setShowModal, resetInactivity } = useInactivity(
    handleLogout,
    isLoggedIn,
    userId,
    isWorkoutActive
  );

  const handleKeepAlive = () => {
    setShowModal(false);
    resetInactivity();
  };

  useSessionLifecycle();

  useUserPresence(isLoggedIn && !isAuthChecking && !showModal);

  return (
    <>
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
          {isAuthChecking ? (
            /* Splash screen adaptável ao modo Claro / Escuro */
            <div className="flex flex-col items-center justify-center py-32 bg-background">
              {/* O círculo giratório usa o azul/verde primário do tema correspondente */}
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              {/* O texto se adapta à cor secundária do tema */}
              <p className="text-muted-foreground text-sm mt-4 animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>
                Carregando o FlowHeart...
              </p>
            </div>
          ) : (
            /* Renderiza as páginas normalmente após concluir a verificação de login */
            <>
              {page.tag === "onboarding" && (
                <OnboardingPage setPage={(p) => navigate(setPage, p)} />
              )}

              {page.tag === "register" && (
                <RegisterPage
                  onAuthSuccess={handleAuthSuccess}
                  setPage={(p) => navigate(setPage, p)}
                  onBack={() => navigate(setPage, { tag: "onboarding" })}
                />
              )}

              {page.tag === "login" && (
                <LoginPage
                  onAuthSuccess={handleAuthSuccess}
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
                  onTimerRunningChange={setIsTimerRunning}
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
            </>
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
