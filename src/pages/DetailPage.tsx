import { SessionDetail } from "../components/SessionDetail";
import type { WorkoutSession } from "../components/SessionHistory";

interface DetailPageProps {
  session: WorkoutSession;
  onBack: () => void;
}

export function DetailPage({ session, onBack }: DetailPageProps) {
  return <SessionDetail session={session} onBack={onBack} />;
}