import { SessionDetail } from "../components/SessionDetail";
import type { WorkoutSession } from "../types";

// Props para o componente DetailPage
interface DetailPageProps {
  session: WorkoutSession;
  onBack: () => void;
}

export function DetailPage({ session, onBack }: DetailPageProps) {
  // Renderiza o componente SessionDetail, passando a sessão e a função de retorno como props
  return <SessionDetail session={session} onBack={onBack} />;
}