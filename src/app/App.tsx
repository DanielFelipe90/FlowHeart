import { useState } from "react";
import type { WorkoutSession } from "../components/SessionHistory";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";

export type Phase = "pre" | "during" | "post";

export type AppPage =
  | { tag: "onboarding" }
  | { tag: "home" }
  | { tag: "workout"; phase: Phase }
  | { tag: "history" }
  | { tag: "detail"; session: WorkoutSession };

export type PreState = { systolic: string; diastolic: string; bpm: string; ihb: boolean };
export type DuringState = { systolic: string; diastolic: string; bpm: string; distance: string; timeSeconds: number; speed: string };
export type PostState = { systolic: string; diastolic: string; bpm: string; ihb: boolean };

export default function App() {
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [userName, setUserName] = useState("");

  const [pre, setPre] = useState<PreState>({ systolic: "", diastolic: "", bpm: "", ihb: false });
  const [during, setDuring] = useState<DuringState>({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0, speed: "" });
  const [post, setPost] = useState<PostState>({ systolic: "", diastolic: "", bpm: "", ihb: false });

  function startNewWorkout() {
    setPre({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setDuring({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0, speed: "" });
    setPost({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setPage({ tag: "workout", phase: "pre" });
  }

  function saveSession() {
    const hours = during.timeSeconds / 3600;
    const speed = hours > 0 && during.distance
      ? (parseFloat(during.distance) / hours).toFixed(1)
      : "0";
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} — ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setSessions((s) => [...s, { id: Date.now().toString(), date, pre, during: { ...during, speed }, post }]);
    setPage({ tag: "history" });
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#0d0f14", fontFamily: "'Inter', sans-serif" }}>
      {page.tag !== "onboarding" && (
        <Header page={page} setPage={setPage} />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {page.tag === "onboarding" && (
          <OnboardingPage
            userName={userName}
            setUserName={setUserName}
            setPage={setPage}
          />
        )}

        {page.tag === "home" && (
          <HomePage
            userName={userName}
            sessions={sessions}
            setPage={setPage}
            startNewWorkout={startNewWorkout}
          />
        )}

        {page.tag === "workout" && (
          <WorkoutPage
            phase={page.phase}
            pre={pre} setPre={setPre}
            during={during} setDuring={setDuring}
            post={post} setPost={setPost}
            setPage={setPage}
            saveSession={saveSession}
          />
        )}

        {page.tag === "history" && (
          <HistoryPage
            sessions={sessions}
            setPage={setPage}
          />
        )}

        {page.tag === "detail" && (
          <DetailPage
            session={page.session}
            onBack={() => setPage({ tag: "history" })}
          />
        )}
      </main>

      {(page.tag === "onboarding" || page.tag === "home") && (
        <Footer />
      )}
    </div>
  );
}