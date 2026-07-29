import type { AppPage, Phase, WorkoutSession } from "../types";

const VALID_PHASES: Phase[] = ["pre", "during", "post"];

function isPhase(value: string): value is Phase {
  return (VALID_PHASES as string[]).includes(value);
}

/** Tags que não exigem sessão autenticada (acessíveis deslogado). */
export const PUBLIC_TAGS = new Set<AppPage["tag"]>([
  "onboarding",
  "login",
  "register",
]);

/** Converte a página ativa (estado do app) na URL correspondente. */
export function pageToPath(page: AppPage): string {
  switch (page.tag) {
    case "onboarding":
      return "/onboarding";
    case "register":
      return "/register";
    case "login":
      return "/login";
    case "home":
      return "/home";
    case "workout":
      return `/workout/${page.phase}`;
    case "history":
      return "/history";
    case "detail":
      return `/history/${page.session.id}`;
    case "estatisticas":
      return "/estatisticas";
    case "perfil":
      return "/perfil";
  }
}

/**
 * Converte a URL atual (pathname) na página correspondente.
 *
 * Retorna `null` quando o caminho não é reconhecido, ou quando é uma
 * página de detalhe (`/history/:id`) cujo id não existe na lista de
 * sessões fornecida — nesses casos, quem chamar deve decidir o fallback
 * (normalmente "home" se logado, "onboarding" se não).
 */
export function parsePath(
  pathname: string,
  sessions: WorkoutSession[]
): AppPage | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return { tag: "onboarding" };

  const [first, second] = segments;

  switch (first) {
    case "onboarding":
      return { tag: "onboarding" };
    case "register":
      return { tag: "register" };
    case "login":
      return { tag: "login" };
    case "home":
      return { tag: "home" };
    case "history": {
      if (!second) return { tag: "history" };
      const session = sessions.find((s) => s.id === second);
      return session ? { tag: "detail", session } : null;
    }
    case "estatisticas":
      return { tag: "estatisticas" };
    case "perfil":
      return { tag: "perfil" };
    case "workout": {
      const phase = second && isPhase(second) ? second : "pre";
      return { tag: "workout", phase };
    }
    default:
      return null;
  }
}
