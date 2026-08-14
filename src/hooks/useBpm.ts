import { useEffect, useRef, useState, useCallback } from 'react';

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

/**
 * O BPM chega ao React exclusivamente pela ponte nativa local —
 * window.mobileBpmBridge (eventos nativeBpmUpdate/nativeBpmStatus, pra updates em
 * tempo real) e window.AndroidNative (leitura síncrona/pull do array e do status
 * atuais, pra sincronizar corretamente não importa quando o hook monta).
 */
export function useBpm({ enabled, onBpmReceived }: UseBpmOptions) {
  const [status, setStatus] = useState<BpmConnectionStatus>('disconnected');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);

  // Acumulador local — usado como fallback defensivo caso a leitura síncrona do
  // array nativo falhe por qualquer motivo.
  const bpmReadingsRef = useRef<number[]>([]);
  const onBpmReceivedRef = useRef(onBpmReceived);

  useEffect(() => {
    onBpmReceivedRef.current = onBpmReceived;
  }, [onBpmReceived]);

  useEffect(() => {
    if (!enabled) return;

    const hasNativeBridge = window.mobileBpmBridge?.isNativeApp === true;

    if (!hasNativeBridge) {
      // PWA rodando fora do app — não há sensor local disponível nesse dispositivo.
      setStatus('disconnected');
      return;
    }

    const initialStatus = window.AndroidNative?.getMonitoringStatus?.();
    if (initialStatus) {
      setStatus(mapNativeStatus(initialStatus));
    } else {
      setStatus('waiting');
    }

    const initialBpm = window.AndroidNative?.getLastBpm?.();
    if (typeof initialBpm === 'number' && initialBpm > 0) {
      setCurrentBpm(initialBpm);
      bpmReadingsRef.current.push(initialBpm);
      onBpmReceivedRef.current?.(initialBpm);
    }

    const handleBpm = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const bpm = detail?.bpm;
      if (typeof bpm === 'number') {
        setCurrentBpm(bpm);
        bpmReadingsRef.current.push(bpm);
        onBpmReceivedRef.current?.(bpm);
      }
    };

    const handleStatus = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail?.status === 'string') {
        setStatus(mapNativeStatus(detail.status));
      }
    };

    window.addEventListener('nativeBpmUpdate', handleBpm);
    window.addEventListener('nativeBpmStatus', handleStatus);

    return () => {
      window.removeEventListener('nativeBpmUpdate', handleBpm);
      window.removeEventListener('nativeBpmStatus', handleStatus);
      setStatus('disconnected');
      setCurrentBpm(null);
    };
  }, [enabled]);

  // Lê o array compartilhado completo direto do lado nativo (fonte de verdade),
  // com fallback pro acumulador local se a chamada falhar por algum motivo.
  const getReadings = useCallback((): number[] => {
    if (window.AndroidNative?.getBpmReadings) {
      try {
        const parsed = JSON.parse(window.AndroidNative.getBpmReadings());
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // cai no fallback abaixo
      }
    }
    return bpmReadingsRef.current;
  }, []);

  // Calcula a média dos BPM recebidos durante o treino. Prefere a média já
  // calculada nativamente, evitando divergência entre o número mostrado no React
  // e o array que originou esse número.
  const getAverageBpm = useCallback((): string => {
    if (window.AndroidNative?.getAverageBpm) {
      const avg = window.AndroidNative.getAverageBpm();
      if (avg > 0) return String(avg);
    }

    const readings = bpmReadingsRef.current;
    if (readings.length === 0) return '';
    const avg = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);
    return String(avg);
  }, []);

  // Reseta as leituras (ao iniciar nova fase ou novo treino)
  const resetReadings = useCallback(() => {
    bpmReadingsRef.current = [];
    setCurrentBpm(null);
  }, []);

  return {
    status,           // estado da conexão
    currentBpm,       // último BPM recebido
    getAverageBpm,    // chama ao finalizar treino
    getReadings,      // array completo da sessão, pra qualquer processamento extra
    resetReadings,    // chama ao iniciar treino
    isMobileOnline: status === 'mobile_connected',
  };
}