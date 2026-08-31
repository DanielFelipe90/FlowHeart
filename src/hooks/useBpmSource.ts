import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

export type BpmSource = 'sensor' | 'magene';
export type BpmMode = BpmSource | 'manual';

export type BpmConnectionStatus =
  | 'disconnected'
  | 'waiting'
  | 'mobile_connected'
  | 'mobile_disconnected';

interface UseBpmSourceOptions {
  enabled: boolean; // só ativa na fase "during"
  onBpmReceived?: (bpm: number) => void;
}

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
    };
    AndroidNative?: {
      // Sensor / Samsung Health (relógio) — auto-detectável, sem pareamento manual
      getSensorMonitoringStatus?: () => string;
      getSensorLastBpm?: () => number;
      getSensorBpmReadings?: () => string; // JSON de number[]
      getSensorAverageBpm?: () => number;
      connectSensor?: () => void;
      disconnectSensor?: () => void;

      // Magene (BLE) — exige pareamento/permissão explícitos
      getMageneMonitoringStatus?: () => string;
      getMageneLastBpm?: () => number;
      getMageneBpmReadings?: () => string; // JSON de number[]
      getMageneAverageBpm?: () => number;
      connectMageneSensor?: () => void;
      disconnectMageneSensor?: () => void;

      // Demais métodos da ponte nativa, sem relação com BPM
      onTokenRefreshed?: (token: string) => void;
      setWorkoutActive?: (active: boolean) => void;
      onLogout?: () => void;
      setInactivityWarningVisible?: (visible: boolean) => void;
    };
  }
}

interface SourceConfig {
  getStatus: () => string | undefined;
  getLastBpm: () => number | undefined;
  getReadings: () => string | undefined;
  getAverage: () => number | undefined;
  connect: () => void;
  disconnect: () => void;
  updateEvent: string;
  statusEvent: string;
}

// Uma entrada por fonte, cada uma na sua própria ponte de getters/eventos.
// É essa separação (em vez de um getMonitoringStatus()/evento genérico
// compartilhado) que elimina a corrida entre sensor e magene: ao trocar de
// fonte, o React simplesmente para de escutar os eventos da fonte antiga —
// não existe mais canal em comum pra um evento tardio contaminar o estado.
const SOURCE_CONFIG: Record<BpmSource, SourceConfig> = {
  sensor: {
    getStatus: () => window.AndroidNative?.getSensorMonitoringStatus?.(),
    getLastBpm: () => window.AndroidNative?.getSensorLastBpm?.(),
    getReadings: () => window.AndroidNative?.getSensorBpmReadings?.(),
    getAverage: () => window.AndroidNative?.getSensorAverageBpm?.(),
    connect: () => window.AndroidNative?.connectSensor?.(),
    disconnect: () => window.AndroidNative?.disconnectSensor?.(),
    updateEvent: 'nativeSensorBpmUpdate',
    statusEvent: 'nativeSensorBpmStatus',
  },
  magene: {
    getStatus: () => window.AndroidNative?.getMageneMonitoringStatus?.(),
    getLastBpm: () => window.AndroidNative?.getMageneLastBpm?.(),
    getReadings: () => window.AndroidNative?.getMageneBpmReadings?.(),
    getAverage: () => window.AndroidNative?.getMageneAverageBpm?.(),
    connect: () => window.AndroidNative?.connectMageneSensor?.(),
    disconnect: () => window.AndroidNative?.disconnectMageneSensor?.(),
    updateEvent: 'nativeMageneBpmUpdate',
    statusEvent: 'nativeMageneBpmStatus',
  },
};

// Cintas BLE (Magene) soluçam por contato/suor/movimento — MageneBleMonitor.kt
// tenta reconectar sozinho até 4 vezes (2s entre tentativas) antes de
// desistir de verdade. Esse debounce precisa cobrir essa janela inteira +
// latência de cada conexão GATT, senão o React desiste antes do nativo
// terminar a última tentativa.
const DISCONNECT_FALLBACK_DEBOUNCE_MS = 12_000;

function hasNativeBridge(): boolean {
  return typeof window !== 'undefined' && window.mobileBpmBridge?.isNativeApp === true;
}

interface BpmSnapshot {
  status: BpmConnectionStatus;
  bpm: number | null;
}

const DISCONNECTED_SNAPSHOT: BpmSnapshot = { status: 'disconnected', bpm: null };

function readSnapshotForSource(source: BpmSource): BpmSnapshot {
  if (!hasNativeBridge()) return DISCONNECTED_SNAPSHOT;
  try {
    const raw = SOURCE_CONFIG[source].getStatus();
    const status = raw ? mapNativeStatus(raw) : 'waiting';
    const bpmRaw = SOURCE_CONFIG[source].getLastBpm();
    const bpm = isValidBpm(bpmRaw) ? bpmRaw : null;
    return { status, bpm };
  } catch {
    return DISCONNECTED_SNAPSHOT;
  }
}

/**
 * Hook único que assina a ponte nativa da fonte atualmente selecionada
 * (sensor OU magene, nunca as duas ao mesmo tempo) e expõe status, BPM, modo
 * e as ações de troca. Antes isso vivia em dois hooks acoplados só por
 * inferência (useBpm lia um status "genérico"; useBpmMode decidia o
 * fallback em cima dele) — como o BPM lido agora depende de qual fonte está
 * selecionada, faz mais sentido esse estado morar junto.
 */
export function useBpmSource({ enabled, onBpmReceived }: UseBpmSourceOptions) {
  const [mode, setMode] = useState<BpmMode | null>(null);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const activeSource: BpmSource | null = mode === 'sensor' || mode === 'magene' ? mode : null;

  const cachedRef = useRef<BpmSnapshot>(DISCONNECTED_SNAPSHOT);

  const getSnapshot = useCallback((): BpmSnapshot => {
    if (!enabled || !activeSource) {
      if (cachedRef.current !== DISCONNECTED_SNAPSHOT) cachedRef.current = DISCONNECTED_SNAPSHOT;
      return cachedRef.current;
    }
    const next = readSnapshotForSource(activeSource);
    if (cachedRef.current.status !== next.status || cachedRef.current.bpm !== next.bpm) {
      cachedRef.current = next;
    }
    return cachedRef.current;
  }, [enabled, activeSource]);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled || !activeSource) return () => {};
      const cfg = SOURCE_CONFIG[activeSource];
      window.addEventListener(cfg.updateEvent, callback);
      window.addEventListener(cfg.statusEvent, callback);
      return () => {
        window.removeEventListener(cfg.updateEvent, callback);
        window.removeEventListener(cfg.statusEvent, callback);
      };
    },
    [enabled, activeSource]
  );

  const { status, bpm: currentBpm } = useSyncExternalStore(subscribe, getSnapshot, () => DISCONNECTED_SNAPSHOT);

  // Acumulador local — fallback defensivo caso o array nativo da fonte ativa
  // não esteja disponível, e dedupe pra não repetir onBpmReceived pro mesmo
  // valor.
  const onBpmReceivedRef = useRef(onBpmReceived);
  useEffect(() => {
    onBpmReceivedRef.current = onBpmReceived;
  }, [onBpmReceived]);

  const readingsRef = useRef<number[]>([]);
  const lastPushedBpmRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || currentBpm === null || currentBpm === lastPushedBpmRef.current) return;
    lastPushedBpmRef.current = currentBpm;
    readingsRef.current.push(currentBpm);
    onBpmReceivedRef.current?.(currentBpm);
  }, [enabled, currentBpm]);

  useEffect(() => {
    if (enabled) return;
    readingsRef.current = [];
    lastPushedBpmRef.current = null;
  }, [enabled]);

  // Auto-seleciona a fonte na primeira detecção. Só "sensor" (relógio /
  // Samsung Health) é auto-detectável sem ação do usuário — magene exige
  // pareamento BLE explícito, então nunca entra aqui sozinho.
  useEffect(() => {
    if (!enabled || mode !== null) return;
    const initial = readSnapshotForSource('sensor');
    setMode(initial.status === 'mobile_connected' ? 'sensor' : 'manual');
  }, [enabled, mode]);

  // Fallback pra manual quando a fonte ativa cai, com debounce pra tolerar
  // reconexão automática do BLE (ver comentário da constante).
  const disconnectFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearDisconnectFallbackTimeout = useCallback(() => {
    if (disconnectFallbackTimeoutRef.current !== undefined) {
      clearTimeout(disconnectFallbackTimeoutRef.current);
      disconnectFallbackTimeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const isDisconnected = status === 'disconnected' || status === 'mobile_disconnected';
    if (!activeSource || !isDisconnected) {
      clearDisconnectFallbackTimeout();
      return;
    }
    if (disconnectFallbackTimeoutRef.current === undefined) {
      disconnectFallbackTimeoutRef.current = setTimeout(() => {
        disconnectFallbackTimeoutRef.current = undefined;
        const stillDisconnected =
          statusRef.current === 'disconnected' || statusRef.current === 'mobile_disconnected';
        if (stillDisconnected && (modeRef.current === 'sensor' || modeRef.current === 'magene')) {
          setMode('manual');
        }
      }, DISCONNECT_FALLBACK_DEBOUNCE_MS);
    }
  }, [status, activeSource, clearDisconnectFallbackTimeout]);

  // Desconecta a fonte ativa ao sair da fase "during" ou desmontar, pra não
  // deixar BLE/HealthConnect rodando em segundo plano após o treino.
  useEffect(() => {
    if (!enabled && activeSource) {
      SOURCE_CONFIG[activeSource].disconnect();
    }
  }, [enabled, activeSource]);

  useEffect(() => {
    return () => {
      if (modeRef.current === 'sensor' || modeRef.current === 'magene') {
        SOURCE_CONFIG[modeRef.current].disconnect();
      }
      clearDisconnectFallbackTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSource = useCallback(
    (source: BpmSource) => {
      clearDisconnectFallbackTimeout();
      readingsRef.current = [];
      lastPushedBpmRef.current = null;
      // Desconecta explicitamente a outra fonte — como agora cada uma tem
      // ponte própria, isso não afeta em nada os eventos da fonte que está
      // sendo selecionada.
      const otherSource: BpmSource = source === 'sensor' ? 'magene' : 'sensor';
      SOURCE_CONFIG[otherSource].disconnect();
      setMode(source);
      SOURCE_CONFIG[source].connect();
    },
    [clearDisconnectFallbackTimeout]
  );

  const selectSensor = useCallback(() => selectSource('sensor'), [selectSource]);
  const selectMagene = useCallback(() => selectSource('magene'), [selectSource]);

  const selectManual = useCallback(() => {
    clearDisconnectFallbackTimeout();
    SOURCE_CONFIG.sensor.disconnect();
    SOURCE_CONFIG.magene.disconnect();
    setMode('manual');
  }, [clearDisconnectFallbackTimeout]);

  const getReadings = useCallback((): number[] => {
    if (activeSource) {
      const raw = SOURCE_CONFIG[activeSource].getReadings();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
            return parsed;
          }
        } catch {
          // JSON inválido — cai no fallback local abaixo.
        }
      }
    }
    return readingsRef.current;
  }, [activeSource]);

  const getAverageBpm = useCallback((): string => {
    if (activeSource) {
      try {
        const nativeAvg = SOURCE_CONFIG[activeSource].getAverage();
        if (isValidBpm(nativeAvg)) return String(Math.round(nativeAvg));
      } catch {
        // segue pro cálculo local
      }
    }
    const readings = getReadings().filter(isValidBpm);
    if (readings.length === 0) return '';
    const avg = Math.round(readings.reduce((sum, v) => sum + v, 0) / readings.length);
    return String(avg);
  }, [activeSource, getReadings]);

  const resetReadings = useCallback(() => {
    readingsRef.current = [];
    lastPushedBpmRef.current = null;
  }, []);

  return useMemo(
    () => ({
      mode,
      status,
      currentBpm,
      isSelecting: mode === null,
      isMobileOnline: status === 'mobile_connected',
      selectSensor,
      selectMagene,
      selectManual,
      getAverageBpm,
      getReadings,
      resetReadings,
    }),
    [mode, status, currentBpm, selectSensor, selectMagene, selectManual, getAverageBpm, getReadings, resetReadings]
  );
}
