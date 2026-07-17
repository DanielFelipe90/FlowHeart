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
import { isAuthenticated, apiGetMe, clearToken, apiFetch } from "../utils/api";
import { useInactivity } from "../hooks/useInactivity";
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

  const {
    sessions, userName, pre, setPre, during, setDuring, post, setPost,
    handleSetUserName, startNewWorkout, saveSession, deleteSession, logout,
    deleteAccount
  } = useWorkout();

  const isLoggedIn = !!userName;

  useEffect(() => {
    if (!isAuthenticated()) return;

    apiGetMe()
      .then(async (user) => {
        handleSetUserName(user.name);
        setUserId(user.id);
        navigate(setPage, { tag: "home" });
      })
      .catch(() => {
        clearToken();
        navigate(setPage, { tag: "onboarding" });
      });
  }, []);

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

  useSessionLifecycle();

  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
              resetInactivity={resetInactivity}
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