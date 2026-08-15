import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

export type BpmConnectionStatus =
  | 'disconnected'    // sem ponte nativa disponível (PWA fora do app) ou sensor parado
  | 'waiting'         // ponte disponível, aguardando primeiro status/leitura
  | 'mobile_connected' // sensor ativo, BPM chegando
  | 'mobile_disconnected'; // sensor parou/deu erro durante o treino

interface UseBpmOptions {
  enabled: boolean; // só ativa na fase "during"
  // Opcional: callback de conveniência pra quem quiser reagir a cada leitura no
  // momento em que ela chega. A sincronização de during.bpm no WorkoutPage NÃO
  // depende mais disso — é feita reativamente a partir de `currentBpm`, pra não
  // ficar sujeita à ordem de inicialização entre useBpm e useBpmMode.
  onBpmReceived?: (bpm: number) => void;
}

// Faixa fisiologicamente plausível de BPM. Usada pra filtrar leituras
// espúrias (0, negativos, NaN, valores absurdos de sensor com ruído) antes de
// elas chegarem na UI ou entrarem no cálculo da média. Mantém consistência
// com os limites já usados no <MetricInput min={30} max={250}> do input
// manual, então "sensor" e "manual" nunca aceitam faixas diferentes.
const MIN_VALID_BPM = 30;
const MAX_VALID_BPM = 250;

function isValidBpm(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_VALID_BPM &&
    value <= MAX_VALID_BPM
  );
}

// Mapeia o enum BpmMonitoringStatus do Android (MONITORING/STOPPED/ERROR) pro
// vocabulário de status já usado pela UI (BpmConnectionStatus).
function mapNativeStatus(status: string): BpmConnectionStatus {
  switch (status) {
    case 'MONITORING':
      return 'mobile_connected';
    case 'STOPPED':
      return 'mobile_disconnected';
    case 'ERROR':
      return 'disconnected';
    default:
      return 'waiting';
  }
}

declare global {
  interface Window {
    mobileBpmBridge?: {
      isNativeApp: boolean;
      updateBpm: (bpm: number) => void;
      updateStatus: (status: string) => void;
    };
    AndroidNative?: {
      getBpmReadings?: () => string; // JSON de number[] — array compartilhado completo
      getAverageBpm?: () => number;  // média já calculada do lado nativo
      getMonitoringStatus?: () => string; // "MONITORING" | "STOPPED" | "ERROR" | ""
      getLastBpm?: () => number; // 0 se não houver leitura ainda
      onTokenRefreshed?: (token: string) => void;
      setWorkoutActive?: (active: boolean) => void;
      onLogout?: () => void;
      setInactivityWarningVisible?: (visible: boolean) => void;
      connectSensor?: () => void; // inicia HealthManager.connect() + fluxo de permissão do SDK no nativo
      disconnectSensor?: () => void; // para o BpmService/BpmMonitor no nativo
      connectMageneSensor?: () => void; // inicia scan+conexão BLE (MageneBleService) no nativo
      disconnectMageneSensor?: () => void; // para o MageneBleService no nativo
    };
  }
}

function hasNativeBridge(): boolean {
  return typeof window !== 'undefined' && window.mobileBpmBridge?.isNativeApp === true;
}

/**
 * Lê o status de monitoramento direto do nativo. É chamada tanto na primeira
 * leitura quanto toda vez que um evento nativeBpmStatus/nativeBpmUpdate
 * dispara — o getter nativo é sempre a fonte de verdade, nunca o payload do
 * evento isoladamente (antes, o hook confiava em event.detail.bpm pras
 * atualizações e em getLastBpm() só no mount, o que podia divergir).
 */
function readStatusFromNative(): BpmConnectionStatus {
  if (!hasNativeBridge()) return 'disconnected';
  try {
    const raw = window.AndroidNative?.getMonitoringStatus?.();
    return raw ? mapNativeStatus(raw) : 'waiting';
  } catch {
    return 'disconnected';
  }
}

function readBpmFromNative(): number | null {
  if (!hasNativeBridge()) return null;
  try {
    const value = window.AndroidNative?.getLastBpm?.();
    return isValidBpm(value) ? value : null;
  } catch {
    return null;
  }
}

function subscribeToNativeEvents(callback: () => void): () => void {
  window.addEventListener('nativeBpmUpdate', callback);
  window.addEventListener('nativeBpmStatus', callback);
  return () => {
    window.removeEventListener('nativeBpmUpdate', callback);
    window.removeEventListener('nativeBpmStatus', callback);
  };
}

interface BpmSnapshot {
  status: BpmConnectionStatus;
  bpm: number | null;
}

const DISCONNECTED_SNAPSHOT: BpmSnapshot = { status: 'disconnected', bpm: null };

/**
 * Sincroniza status + BPM com a ponte nativa usando useSyncExternalStore —
 * a forma recomendada pelo React pra assinar uma fonte de dados externa e
 * mutável (a ponte window.AndroidNative), em vez de useState+useEffect
 * manuais. Isso evita "tearing" (status e bpm ficando um passo fora de
 * sincronia entre si) e garante que toda leitura passa pelo mesmo caminho.
 */
function useBpmNativeSnapshot(enabled: boolean): BpmSnapshot {
  const cachedRef = useRef<BpmSnapshot>(DISCONNECTED_SNAPSHOT);

  const getSnapshot = useCallback((): BpmSnapshot => {
    if (!enabled) {
      if (cachedRef.current !== DISCONNECTED_SNAPSHOT) {
        cachedRef.current = DISCONNECTED_SNAPSHOT;
      }
      return cachedRef.current;
    }

    const status = readStatusFromNative();
    const bpm = readBpmFromNative();
    if (cachedRef.current.status !== status || cachedRef.current.bpm !== bpm) {
      cachedRef.current = { status, bpm };
    }
    return cachedRef.current;
  }, [enabled]);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled) return () => {};
      return subscribeToNativeEvents(callback);
    },
    [enabled]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => DISCONNECTED_SNAPSHOT);
}

/**
 * O BPM chega ao React exclusivamente pela ponte nativa local —
 * window.mobileBpmBridge (eventos nativeBpmUpdate/nativeBpmStatus, só como
 * "avise-me quando algo mudou") e window.AndroidNative (leitura
 * síncrona/pull do array, do status e do BPM atuais — a fonte de verdade de
 * fato, lida a cada notificação).
 */
export function useBpm({ enabled, onBpmReceived }: UseBpmOptions) {
  const onBpmReceivedRef = useRef(onBpmReceived);
  useEffect(() => {
    onBpmReceivedRef.current = onBpmReceived;
  }, [onBpmReceived]);

  const { status, bpm: currentBpm } = useBpmNativeSnapshot(enabled);

  // Acumulador local — usado como fallback defensivo caso a leitura síncrona
  // do array nativo (getBpmReadings) falhe ou não exista, e também como
  // "dedupe" pra não disparar onBpmReceived mais de uma vez pro mesmo valor
  // (ex.: quando um evento nativeBpmStatus, sem relação com BPM, dispara uma
  // nova checagem do snapshot mas o BPM não mudou).
  const readingsRef = useRef<number[]>([]);
  const lastPushedBpmRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || currentBpm === null || currentBpm === lastPushedBpmRef.current) return;
    lastPushedBpmRef.current = currentBpm;
    readingsRef.current.push(currentBpm);
    onBpmReceivedRef.current?.(currentBpm);
  }, [enabled, currentBpm]);

  // Defesa extra: se a fase "during" for desativada sem que resetReadings()
  // tenha sido chamado explicitamente, não deixa leituras de uma sessão
  // vazarem pro cálculo da média da próxima.
  useEffect(() => {
    if (enabled) return;
    readingsRef.current = [];
    lastPushedBpmRef.current = null;
  }, [enabled]);

  // Lê o array compartilhado completo direto do lado nativo (fonte de
  // verdade), com fallback pro acumulador local se a chamada falhar ou o
  // retorno não for o JSON esperado.
  const getReadings = useCallback((): number[] => {
    if (window.AndroidNative?.getBpmReadings) {
      try {
        const parsed = JSON.parse(window.AndroidNative.getBpmReadings());
        if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
          return parsed;
        }
      } catch {
        // JSON inválido/malformado vindo do nativo — cai no fallback abaixo.
      }
    }
    return readingsRef.current;
  }, []);

  // Calcula a média dos BPM recebidos durante o treino. Prefere a média já
  // calculada nativamente (evitando divergência entre o número mostrado no
  // React e o array que o originou), mas valida o resultado antes de
  // confiar nele — e o fallback local agora reaproveita getReadings() (que
  // já tenta o array nativo primeiro) em vez de ler o ref direto, então os
  // dois caminhos nunca divergem sobre qual é a fonte dos dados.
  const getAverageBpm = useCallback((): string => {
    try {
      const nativeAvg = window.AndroidNative?.getAverageBpm?.();
      if (isValidBpm(nativeAvg)) return String(Math.round(nativeAvg));
    } catch {
      // segue pro cálculo local
    }

    const readings = getReadings().filter(isValidBpm);
    if (readings.length === 0) return '';
    const avg = Math.round(readings.reduce((sum, v) => sum + v, 0) / readings.length);
    return String(avg);
  }, [getReadings]);

  // Reseta as leituras (ao iniciar nova fase ou novo treino)
  const resetReadings = useCallback(() => {
    readingsRef.current = [];
    lastPushedBpmRef.current = null;
  }, []);

  return useMemo(
    () => ({
      status,           // estado da conexão
      currentBpm,       // último BPM recebido (já validado contra a faixa 30–250)
      getAverageBpm,    // chama ao finalizar treino
      getReadings,      // array completo da sessão, pra qualquer processamento extra
      resetReadings,    // chama ao iniciar treino
      isMobileOnline: status === 'mobile_connected',
    }),
    [status, currentBpm, getAverageBpm, getReadings, resetReadings]
  );
}