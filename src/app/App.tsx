import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import type { AppPage, WorkoutSession } from "../types";
import { Header } from "../components/Header";
import { InactivityModal } from "../components/InactivityModal";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { PerfilPage } from "../pages/PerfilPage";
import { apiGetMe, clearToken, initAuthToken, notifyNativeUserAuthenticated } from "../utils/api";
import { pageToPath, parsePath, PUBLIC_TAGS } from "../utils/routes";
import { useWorkout } from "../hooks/useWorkout";
import { useInactivity } from "../hooks/useInactivity";
import { useUserPresence } from "../hooks/useUserPresence";
import { useSessionLifecycle } from "../hooks/useSessionLifecycle";
import { useWorkoutTokenRefresh } from "../hooks/useWorkoutTokenRefresh";

const loadEstatisticas = () => import("../pages/EstatisticasPage");
const EstatisticasPage = lazy(() =>
  loadEstatisticas().then((m) => ({ default: m.EstatisticasPage }))
);

function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  const path = pageToPath(page);
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }

  const run = () => setPage(page);

  if (!document.startViewTransition) {
    run();
    return;
  }

  // Se for uma rota com componente lazy, garante que o chunk já
  // esteja carregado ANTES de iniciar a transição, evitando que o
  // Suspense suspenda no meio do startViewTransition (o que trava
  // a transição na primeira visita à página).
  if (page.tag === "estatisticas") {
    loadEstatisticas().then(() => document.startViewTransition(run));
    return;
  }

  document.startViewTransition(run);
}

export default function App() {
  // Inicializa o token caso venha na URL (ex: SSO do App Kotlin)
  initAuthToken();

  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // isLoggedIn agora é ESTADO, não mais derivado direto de isAuthenticated().
  // O token em memória se perde no refresh (F5) — quem prova a sessão
  // de verdade é o cookie HttpOnly, validado via apiGetMe() abaixo.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hook central — Passamos a trava de autenticação como argumento
  const { userName, ...workout } = useWorkout(!isAuthChecking && isLoggedIn);

  const {
    sessions, pre, setPre, during, setDuring, post, setPost,
    handleSetUserName, startNewWorkout, saveSession, deleteSession, logout,
    deleteAccount, fetchSessions, isLoadingSessions
  } = workout;

  // Roda uma única vez, na montagem: sempre tenta validar a sessão contra o
  // backend (cookie HttpOnly), independente do token em memória já existir
  // ou não. Isso garante o spinner + a checagem real após um F5.
  //
  // A página exibida é resolvida a partir da URL atual (para manter o
  // usuário na mesma tela após um refresh), com fallback para "home"
  // (logado) ou "onboarding" (deslogado) quando a URL não corresponde a
  // nenhuma página válida.
  useEffect(() => {
    apiGetMe()
      .then(async (user) => {
        handleSetUserName(user.name);
        setUserId(user.id);
        notifyNativeUserAuthenticated(user.id, user.name);
        setIsLoggedIn(true);
        loadEstatisticas();
        const fetchedSessions = await fetchSessions();

        const requested = parsePath(window.location.pathname, fetchedSessions);
        const target: AppPage =
          requested && !PUBLIC_TAGS.has(requested.tag) ? requested : { tag: "home" };

        setPage(target);
        window.history.replaceState(null, "", pageToPath(target));
      })
      .catch(() => {
        clearToken();
        setIsLoggedIn(false);

        const requested = parsePath(window.location.pathname, []);
        const target: AppPage =
          requested && PUBLIC_TAGS.has(requested.tag) ? requested : { tag: "onboarding" };

        setPage(target);
        window.history.replaceState(null, "", pageToPath(target));
      })
      .finally(() => setIsAuthChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém uma ref com a lista de sessões mais recente, para o listener de
  // popstate abaixo (evita closure desatualizada sem precisar recriar o
  // listener a cada mudança de `sessions`).
  const sessionsRef = useRef<WorkoutSession[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Sincroniza a página com os botões voltar/avançar do navegador.
  useEffect(() => {
    const handlePopState = () => {
      if (isAuthChecking) return;

      const requested = parsePath(window.location.pathname, sessionsRef.current);

      if (!isLoggedIn) {
        setPage(
          requested && PUBLIC_TAGS.has(requested.tag)
            ? requested
            : { tag: "onboarding" }
        );
        return;
      }

      setPage(
        requested && !PUBLIC_TAGS.has(requested.tag) ? requested : { tag: "home" }
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn, isAuthChecking]);

  const handleAuthSuccess = useCallback(async (): Promise<boolean> => {
    try {
      const user = await apiGetMe();
      handleSetUserName(user.name);
      setUserId(user.id);
      notifyNativeUserAuthenticated(user.id, user.name);
      setIsLoggedIn(true);
      return true;
    } catch {
      clearToken();
      setIsLoggedIn(false);
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

  // Logout explícito (menu gaveta): logout() do hook já chama apiLogout(),
  // que invalida a sessão de verdade no servidor (deleta o cookie HttpOnly).
  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    window.history.replaceState(null, "", "/onboarding");
    navigate(setPage, { tag: "onboarding" });
  }, [logout, setPage]);

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate(setPage, { tag: "onboarding" });
  };

  const isWorkoutActive = page.tag === "workout" || isTimerRunning;

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

  useWorkoutTokenRefresh(isWorkoutActive);

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
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">              {/* O círculo giratório usa o azul/verde primário do tema correspondente */}
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
                  userId={userId}
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
                  <EstatisticasPage sessions={sessions} userName={userName} isLoading={isLoadingSessions} />
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

      </div>
    </>
  );
}