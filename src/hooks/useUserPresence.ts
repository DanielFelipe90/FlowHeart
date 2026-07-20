import { useEffect } from "react";
import { apiFetch } from "../utils/api";

/**
 * Hook para gerenciar o heartbeat de presença do usuário.
 * Só dispara requisições quando 'enabled' é verdadeiro.
 */
export function useUserPresence(enabled: boolean) {
  useEffect(() => {
    // 1. A trava: se não estiver habilitado, encerra a execução imediatamente
    // Isso evita que o heartbeat dispare antes do login ou após o logout
    if (!enabled) return;

    // 2. Lógica do heartbeat
    const heartbeat = async () => {
      try {
        await apiFetch("/auth/heartbeat", { method: "POST" });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    };

    // 3. Executa imediatamente e depois a cada 30 segundos
    heartbeat();
    const interval = setInterval(heartbeat, 120000); // 2 minutos
    // 4. Limpeza (essencial para não acumular intervalos quando o estado mudar)
    return () => clearInterval(interval);
  }, [enabled]); // 5. O useEffect reage sempre que o estado 'enabled' mudar
}