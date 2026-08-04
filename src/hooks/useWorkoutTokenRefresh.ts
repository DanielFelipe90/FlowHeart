import { useEffect } from "react";
import { apiFetch, loadToken, saveToken } from "../utils/api";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 min

export function useWorkoutTokenRefresh(isWorkoutActive: boolean) {
  useEffect(() => {
    // // CORREÇÃO: Avisa a ponte Android sobre o estado do treino
    if (typeof window !== "undefined" && (window as any).AndroidNative?.setWorkoutActive) {
      (window as any).AndroidNative.setWorkoutActive(isWorkoutActive);
    }

    if (!isWorkoutActive) return;

    const refresh = async () => {
      try {
        const res = await apiFetch("/auth/refresh", { method: "POST" });
        if (!res.ok) return;

        if (loadToken()) {
          const data = await res.json();
          if (data?.access_token) {
            saveToken(data.access_token);
          }
        }
      } catch (err) {
        console.error("Erro ao renovar token durante treino:", err);
      }
    };

    refresh();

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);
}