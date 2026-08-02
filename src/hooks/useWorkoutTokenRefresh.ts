import { useEffect } from "react";
import { apiFetch, loadToken, saveToken } from "../utils/api";

// Deve ser menor que ACCESS_TOKEN_EXPIRE_MINUTES (padrão 30 min) com boa
// margem, para garantir que o refresh sempre chegue antes do token expirar
// mesmo com alguma variação de rede/latência.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 min

/**
 * Renova o token/cookie de sessão periodicamente, mas SOMENTE enquanto um
 * treino estiver em andamento.
 *
 * Por que não usar o heartbeat de presença (useUserPresence) para isso?
 * Porque o heartbeat dispara sempre que a aba está aberta, independente de
 * atividade real do usuário. Se ele renovasse o token, a sessão nunca
 * expiraria enquanto a aba ficasse aberta — mesmo com o usuário totalmente
 * inativo — o que anularia o teto de segurança do
 * ACCESS_TOKEN_EXPIRE_MINUTES.
 *
 * Este hook é escopado deliberadamente: só renova o token quando existe um
 * motivo legítimo para a sessão durar mais que o padrão (um treino em
 * andamento), preservando a expiração normal em qualquer outro cenário
 * (ex.: aba aberta parada na Home).
 */
export function useWorkoutTokenRefresh(isWorkoutActive: boolean) {
  useEffect(() => {
    if (!isWorkoutActive) return;

    const refresh = async () => {
      try {
        const res = await apiFetch("/auth/refresh", { method: "POST" });
        if (!res.ok) return;

        // /auth/refresh também renova o cookie HttpOnly automaticamente
        // (via Set-Cookie), o que já cobre o cliente Web.
        //
        // Para o cliente mobile (App Kotlin via WebView), a autenticação
        // usa o header Authorization: Bearer com um token guardado em
        // memória (ver saveToken/loadToken em utils/api.ts) — esse token
        // NÃO é atualizado pelo Set-Cookie. Por isso, se já havia um token
        // em memória, atualizamos com o novo token retornado no corpo.
        if (loadToken()) {
          const data = await res.json();
          if (data?.access_token) {
            saveToken(data.access_token);
          }
        }
      } catch (err) {
        // Não interrompe o treino em andamento por causa de uma falha de
        // rede pontual — só loga. Se o token de fato expirar, o próximo
        // saveSession() vai falhar e isso já é tratado/logado lá.
        console.error("Erro ao renovar token durante treino:", err);
      }
    };

    // Dispara IMEDIATAMENTE ao entrar em qualquer fase do treino
    refresh();

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);
}