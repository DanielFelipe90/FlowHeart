import { SessionDetail } from "../components/SessionDetail";
import type { WorkoutSession } from "../types";

interface DetailPageProps {
  session: WorkoutSession;
  onBack: () => void;
}

export function DetailPage({ session, onBack }: DetailPageProps) {
  return <SessionDetail session={session} onBack={onBack} />;
}