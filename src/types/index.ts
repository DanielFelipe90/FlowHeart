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
  bpmSeries?: number[];
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
  | { tag: "estatisticas" }
  | { tag: "perfil" }
  | { tag: "onboarding" }
  | { tag: "register" }
  | { tag: "login" }
  | { tag: "home" }
  | { tag: "workout"; phase: Phase }
  | { tag: "history" }
  | { tag: "detail"; session: WorkoutSession };

// Tipo para as opções de notificação, estendendo NotificationOptions com renotify e silent
export type FlowNotificationOptions = NotificationOptions & {
    renotify?: boolean;
    silent?: boolean;
    vibrate?: number[]; // Adiciona a propriedade vibrate para suportar vibração
};