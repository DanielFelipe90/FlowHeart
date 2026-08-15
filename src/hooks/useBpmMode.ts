import { useCallback, useEffect, useRef, useState } from 'react';
import type { BpmConnectionStatus } from './useBpm';

export type BpmMode = 'sensor' | 'magene' | 'manual';

interface UseBpmModeOptions {
  enabled: boolean; // true só durante a fase "during" — controla o cleanup do sensor nativo
  isMobileOnline: boolean;
  status: BpmConnectionStatus;
}

// Tempo máximo de proteção entre o usuário escolher um sensor e o primeiro
// status "de verdade" chegar do nativo. Depois disso a janela de graça
// simplesmente se encerra — não força nenhuma troca de modo sozinha, só para
// de blindar a seleção atual contra o fallback automático, deixando o
// próximo status real decidir. Sem esse teto, um SDK que nunca emite status
// (ex.: permissão negada silenciosamente) deixaria o app bloqueando o
// fallback pra sempre.
const MODE_SWITCH_GRACE_PERIOD_MS = 12_000;

// Ao trocar direto entre sensor <-> magene, chamamos disconnect da fonte
// antiga e connect da nova em sequência, mas são duas chamadas nativas
// assíncronas que podem responder fora de ordem: é comum a nova fonte já
// avisar 'waiting' (encerrando a janela de graça acima) ANTES do evento
// tardio de STOPPED da fonte antiga sendo desligada chegar. Sem esse
// debounce, esse "soluço" de status faz o app achar que a fonte recém
// selecionada caiu e chuta de volta pro manual — mesmo ela estando ok. Só
// tratamos como desconexão de verdade se o status ficar ruim por mais que
// esse tempo, o que dá espaço pro soluço se resolver sozinho.
const DISCONNECT_FALLBACK_DEBOUNCE_MS = 12_000;

function disconnectAllNativeSensors() {
  window.AndroidNative?.disconnectSensor?.();
  window.AndroidNative?.disconnectMageneSensor?.();
}

export function useBpmMode({ enabled, isMobileOnline, status }: UseBpmModeOptions) {
  const [mode, setMode] = useState<BpmMode | null>(null);

  const modeRef = useRef(mode);
  const statusRef = useRef(status);
  const isTransitioningRef = useRef(false);
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const disconnectFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearGraceTimeout = useCallback(() => {
    if (graceTimeoutRef.current !== undefined) {
      clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = undefined;
    }
  }, []);

  const clearDisconnectFallbackTimeout = useCallback(() => {
    if (disconnectFallbackTimeoutRef.current !== undefined) {
      clearTimeout(disconnectFallbackTimeoutRef.current);
      disconnectFallbackTimeoutRef.current = undefined;
    }
  }, []);

  const endTransition = useCallback(() => {
    isTransitioningRef.current = false;
    clearGraceTimeout();
  }, [clearGraceTimeout]);

  // Se o modo atual é sensor/magene e o status mais recente indica que caiu,
  // volta pra manual. Extraída como função separada (em vez de só um trecho
  // do efeito abaixo) porque também precisa rodar quando a janela de graça
  // expira por timeout, sem depender de um novo evento de status pra
  // disparar o efeito de novo.
  const fallbackToManualIfDisconnected = useCallback(() => {
    const isDisconnected = statusRef.current === 'disconnected' || statusRef.current === 'mobile_disconnected';
    if (isDisconnected && (modeRef.current === 'sensor' || modeRef.current === 'magene')) {
      setMode('manual');
    }
  }, []);

  const beginTransition = useCallback(() => {
    isTransitioningRef.current = true;
    clearGraceTimeout();
    // Importante: o timeout só ENCERRA a janela de proteção — ele nunca força
    // setMode('manual') sozinho. Conectar Magene envolve diálogo de permissão
    // de Bluetooth + scan BLE, que rotineiramente passa de 12s; se o timeout
    // chutasse o usuário de volta pro manual nesse meio tempo, cancelaria uma
    // conexão que só ainda não teve tempo de responder. Depois do prazo, o
    // próximo status real vindo do nativo (evento nativeBpmStatus) é quem
    // decide — se realmente falhou, o efeito abaixo cuida do fallback.
    graceTimeoutRef.current = setTimeout(endTransition, MODE_SWITCH_GRACE_PERIOD_MS);
  }, [clearGraceTimeout, endTransition]);

  // Auto-seleciona na montagem/detecção inicial do sensor
  useEffect(() => {
    if (mode === null) {
      setMode(isMobileOnline ? 'sensor' : 'manual');
    }
  }, [isMobileOnline, mode]);

  // Fallback automático pra manual quando o sensor cai — exceto durante a
  // janela de graça logo após o usuário trocar de modo manualmente, pra dar
  // tempo do nativo conectar antes de julgarmos que a conexão caiu. Além
  // disso, mesmo fora da janela de graça, um status ruim só vira fallback de
  // verdade depois de persistir por DISCONNECT_FALLBACK_DEBOUNCE_MS — ver
  // comentário da constante pra entender a corrida que isso evita.
  useEffect(() => {
    if (isTransitioningRef.current) {
      if (status === 'waiting' || status === 'mobile_connected') {
        endTransition();
      }
      return;
    }

    const isDisconnected = status === 'disconnected' || status === 'mobile_disconnected';
    const isAutoMode = mode === 'sensor' || mode === 'magene';

    if (!isDisconnected || !isAutoMode) {
      // Status recuperou (ou não é mais um modo automático) — qualquer
      // fallback agendado por uma queda anterior não vale mais.
      clearDisconnectFallbackTimeout();
      return;
    }

    if (disconnectFallbackTimeoutRef.current === undefined) {
      disconnectFallbackTimeoutRef.current = setTimeout(() => {
        disconnectFallbackTimeoutRef.current = undefined;
        fallbackToManualIfDisconnected();
      }, DISCONNECT_FALLBACK_DEBOUNCE_MS);
    }
  }, [status, mode, endTransition, fallbackToManualIfDisconnected, clearDisconnectFallbackTimeout]);

  // Desliga qualquer sensor nativo ativo quando a fase "during" termina (o
  // usuário avançou pro post-treino), pra não deixar BLE/HealthConnect
  // rodando em segundo plano depois do treino já ter acabado.
  useEffect(() => {
    if (!enabled && (modeRef.current === 'sensor' || modeRef.current === 'magene')) {
      disconnectAllNativeSensors();
    }
  }, [enabled]);

  // Mesma proteção, mas para o caso de desmontagem total do componente (ex.:
  // o usuário navega pra fora da tela de treino no meio do processo).
  useEffect(() => {
    return () => {
      if (modeRef.current === 'sensor' || modeRef.current === 'magene') {
        disconnectAllNativeSensors();
      }
      clearGraceTimeout();
      clearDisconnectFallbackTimeout();
    };
    // Só queremos o cleanup de desmontagem real, não a cada mudança de dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSensor = useCallback(() => {
    clearDisconnectFallbackTimeout();
    beginTransition();
    setMode('sensor');
    window.AndroidNative?.disconnectMageneSensor?.();
    window.AndroidNative?.connectSensor?.();
  }, [beginTransition, clearDisconnectFallbackTimeout]);

  const selectMagene = useCallback(() => {
    clearDisconnectFallbackTimeout();
    beginTransition();
    setMode('magene');
    window.AndroidNative?.disconnectSensor?.();
    window.AndroidNative?.connectMageneSensor?.();
  }, [beginTransition, clearDisconnectFallbackTimeout]);

  const selectManual = useCallback(() => {
    clearDisconnectFallbackTimeout();
    endTransition();
    setMode('manual');
    disconnectAllNativeSensors();
  }, [endTransition, clearDisconnectFallbackTimeout]);

  return {
    mode,
    selectSensor,
    selectMagene,
    selectManual,
    isSelecting: mode === null,
  };
}