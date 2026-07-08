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
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { PerfilPage } from "../pages/PerfilPage";
import { EstatisticasPage } from "../pages/EstatisticasPage";

function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  if (!document.startViewTransition) {
    setPage(page);
    return;
  }
  document.startViewTransition(() => setPage(page));
}

export default function App() {
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });

  const {
    sessions,
    userName,
    pre,
    setPre,
    during,
    setDuring,
    post,
    setPost,
    handleSetUserName,
    startNewWorkout,
    saveSession,
    logout,
  } = useWorkout();

  const handleStartWorkout = () => {
    startNewWorkout();
    navigate(setPage, { tag: "workout", phase: "pre" });
  };

  const handleSaveAndNavigate = () => {
    saveSession();
    navigate(setPage, { tag: "history" });
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#0d0f14", fontFamily: "'Inter', sans-serif" }}
    >
      {page.tag !== "onboarding" &&
        page.tag !== "register" &&
        page.tag !== "login" && (
          <Header
            page={page}
            setPage={(p) => navigate(setPage, p)}
            userName={userName}
            onLogout={() => {
              logout();
              navigate(setPage, { tag: "onboarding" });
            }}
          />
        )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {page.tag === "onboarding" && (
          <OnboardingPage setPage={(p) => navigate(setPage, p)} />
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
            pre={pre}
            setPre={setPre}
            during={during}
            setDuring={setDuring}
            post={post}
            setPost={setPost}
            setPage={(p) => navigate(setPage, p)}
            saveSession={handleSaveAndNavigate}
          />
        )}

        {page.tag === "history" && (
          <HistoryPage
            sessions={sessions}
            setPage={(p) => navigate(setPage, p)}
            onBack={() => navigate(setPage, { tag: "home" })}
          />
        )}

        {page.tag === "detail" && (
          <DetailPage
            session={page.session}
            onBack={() => navigate(setPage, { tag: "history" })}
          />
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

        {page.tag === "perfil" && <PerfilPage userName={userName} />}

        {page.tag === "estatisticas" && (
          <EstatisticasPage sessions={sessions} />
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
