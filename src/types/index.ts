// ─── Tipos globais do FlowHeart ───────────────────────────────────────────────

/** Fase atual do fluxo de registro de treino */
export type Phase = "pre" | "during" | "post";

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

/** Sessão de treino completa */
export interface WorkoutSession {
  id: string;
  date: string;
  pre: PreState;
  during: DuringState;
  post: PostState;
}

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