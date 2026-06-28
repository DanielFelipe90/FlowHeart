import { useEffect, useState } from "react";
import type { WorkoutSession } from "../components/SessionHistory";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { OnboardingPage } from "../pages/OnboardingPage";
import { HomePage } from "../pages/HomePage";
import { WorkoutPage } from "../pages/WorkoutPage";
import { HistoryPage } from "../pages/HistoryPage";
import { DetailPage } from "../pages/DetailPage";
import { saveSessions, loadSessions, saveUserName, loadUserName } from "../utils/storage";

// ─── Tipos exportados ─────────────────────────────────────────────────────────
// Exportados para que páginas e componentes possam referenciar
// sem criar dependências circulares.

/** Fase atual do fluxo de registro de treino */
export type Phase = "pre" | "during" | "post";

/**
 * União discriminada que representa a página ativa do app.
 * Cada variante carrega apenas os dados necessários para aquela tela.
 */
export type AppPage =
  | { tag: "onboarding" }
  | { tag: "home" }
  | { tag: "workout"; phase: Phase }
  | { tag: "history" }
  | { tag: "detail"; session: WorkoutSession };

/** Dados coletados antes do treino */
export type PreState = {
  systolic: string;
  diastolic: string;
  bpm: string;
  ihb: boolean;
};

/** Dados coletados durante o treino */
export type DuringState = {
  systolic: string;
  diastolic: string;
  bpm: string;
  distance: string;
  timeSeconds: number;
  speed: string;
};

/** Dados coletados após o treino */
export type PostState = {
  systolic: string;
  diastolic: string;
  bpm: string;
  ihb: boolean;
};

// ─── Helper de navegação ──────────────────────────────────────────────────────

/**
 * Navega para uma nova página aplicando a View Transitions API quando disponível.
 * O fallback garante compatibilidade com browsers que não suportam a API.
 *
 * A animação (slide) é definida no index.css via ::view-transition-old/new.
 */
function navigate(setPage: (p: AppPage) => void, page: AppPage) {
  if (!document.startViewTransition) {
    // Fallback: troca de página sem animação
    setPage(page);
    return;
  }
  // Envolve a mudança de estado na transição para acionar a animação CSS
  document.startViewTransition(() => setPage(page));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function App() {

  // ── Estado de navegação ──────────────────────────────────────────────────
  // Começa no onboarding; após confirmar o nome, vai para home.
  const [page, setPage] = useState<AppPage>({ tag: "onboarding" });

  // ── Estado persistido ────────────────────────────────────────────────────

  /**
   * Sessões de treino carregadas do localStorage na inicialização.
   * O cast `as WorkoutSession[]` é seguro porque saveSessions()
   * sempre serializa objetos com a mesma estrutura.
   */
  const [sessions, setSessions] = useState<WorkoutSession[]>(
    () => loadSessions() as WorkoutSession[]
  );

  /**
   * Nome do usuário carregado do localStorage.
   * Se existir, o app poderia pular o onboarding futuramente.
   */
  const [userName, setUserName] = useState<string>(() => loadUserName());

  /**
   * Persiste as sessões no localStorage sempre que o array mudar.
   * useEffect com [sessions] garante que o save ocorre após
   * cada novo treino adicionado.
   */
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // ── Estado temporário do treino em andamento ─────────────────────────────
  // Resetado em startNewWorkout() antes de cada nova sessão.

  const [pre, setPre] = useState<PreState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    ihb: false,
  });

  const [during, setDuring] = useState<DuringState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    distance: "",
    timeSeconds: 0,
    speed: "",
  });

  const [post, setPost] = useState<PostState>({
    systolic: "",
    diastolic: "",
    bpm: "",
    ihb: false,
  });

  // ── Ações ────────────────────────────────────────────────────────────────

  /**
   * Salva o nome do usuário no estado local e no localStorage.
   * Chamada no onboarding ao confirmar o nome — garante persistência
   * entre sessões do navegador.
   */
  function handleSetUserName(name: string) {
    setUserName(name);
    saveUserName(name);
  }

  /**
   * Inicia um novo treino zerando todos os estados temporários
   * e navegando para a fase pré-treino.
   */
  function startNewWorkout() {
    setPre({ systolic: "", diastolic: "", bpm: "", ihb: false });
    setDuring({ systolic: "", diastolic: "", bpm: "", distance: "", timeSeconds: 0, speed: "" });
    setPost({ systolic: "", diastolic: "", bpm: "", ihb: false });
    navigate(setPage, { tag: "workout", phase: "pre" });
  }

  /**
   * Finaliza o treino:
   * 1. Calcula a velocidade média (distância ÷ horas)
   * 2. Formata a data/hora atual
   * 3. Adiciona a nova sessão ao array (dispara o useEffect de persistência)
   * 4. Navega para o histórico
   */
  function saveSession() {
    const hours = during.timeSeconds / 3600;
    const speed =
      hours > 0 && during.distance
        ? (parseFloat(during.distance) / hours).toFixed(1)
        : "0";

    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} — ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setSessions((s) => [
      ...s,
      { id: Date.now().toString(), date, pre, during: { ...during, speed }, post },
    ]);

    navigate(setPage, { tag: "history" });
  }

  // ── Render ───────────────────────────────────────────────────────────────

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

        {/* Onboarding: exibido apenas na primeira visita (ou se não houver nome salvo) */}
        {page.tag === "onboarding" && (
          <OnboardingPage
            userName={userName}
            setUserName={handleSetUserName}
            setPage={(p) => navigate(setPage, p)}
          />
        )}

        {/* Home: resumo do último treino e acesso rápido às ações principais */}
        {page.tag === "home" && (
          <HomePage
            userName={userName}
            sessions={sessions}
            setPage={(p) => navigate(setPage, p)}
            startNewWorkout={startNewWorkout}
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
            saveSession={saveSession}
          />
        )}

        {/* History: lista de todas as sessões em ordem cronológica inversa */}
        {page.tag === "history" && (
          <HistoryPage
            sessions={sessions}
            setPage={(p) => navigate(setPage, p)}
          />
        )}

        {/* Detail: análise completa de uma sessão específica com gráficos */}
        {page.tag === "detail" && (
          <DetailPage
            session={page.session}
            onBack={() => navigate(setPage, { tag: "history" })}
          />
        )}

      </main>

      {/* Footer: visível apenas nas páginas iniciais, fixo na parte inferior */}
      {(page.tag === "onboarding" || page.tag === "home") && (
        <Footer />
      )}
    </div>
  );
}