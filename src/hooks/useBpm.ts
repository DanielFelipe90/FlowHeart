import { useEffect, useRef, useState, useCallback } from 'react';
import { API_URL } from '../utils/api';

export type BpmConnectionStatus =
  | 'disconnected'    // WebSocket com backend não conectado
  | 'waiting'         // WebSocket conectado, aguardando Flutter
  | 'flutter_connected' // Flutter online, BPM chegando
  | 'flutter_disconnected'; // Flutter desconectou durante treino

interface UseBpmOptions {
  userId: string | null;
  enabled: boolean; // só conecta na fase "during"
  onBpmReceived: (bpm: number) => void; // callback pra atualizar DuringState
}

export function useBpm({ userId, enabled, onBpmReceived }: UseBpmOptions) {
  const [status, setStatus] = useState<BpmConnectionStatus>('disconnected');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);

  // Acumula leituras para calcular a média ao finalizar
  const bpmReadingsRef = useRef<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const onBpmReceivedRef = useRef(onBpmReceived);

  useEffect(() => {
    onBpmReceivedRef.current = onBpmReceived;
  }, [onBpmReceived]);

  // Conecta ao WebSocket do backend quando a fase "during" iniciar
  useEffect(() => {
    if (!enabled || !userId) return;

    // Monta a URL do WebSocket a partir da URL da API HTTP
    // http://localhost:8000 → ws://localhost:8000
    // https://api.run.app   → wss://api.run.app
    const wsUrl = API_URL
      .replace(/^https/, 'wss')
      .replace(/^http/, 'ws');

    const ws = new WebSocket(`${wsUrl}/ws/bpm/pwa?user_id=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('waiting');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Mensagem de status do Flutter
      if (data.status === 'flutter_connected') {
        setStatus('flutter_connected');
        return;
      }
      if (data.status === 'flutter_disconnected') {
        setStatus('flutter_disconnected');
        setCurrentBpm(null);
        return;
      }

      // Leitura de BPM
      if (typeof data.bpm === 'number') {
        const bpm = data.bpm;
        setCurrentBpm(bpm);
        bpmReadingsRef.current.push(bpm);
        onBpmReceivedRef.current(bpm);
      }
    };

    ws.onerror = () => setStatus('disconnected');
    ws.onclose = () => setStatus('disconnected');

    return () => {
      ws.close();
      wsRef.current = null;
      setStatus('disconnected');
      setCurrentBpm(null);
    };
  }, [enabled, userId]);

  // Calcula a média dos BPM recebidos durante o treino
  const getAverageBpm = useCallback((): string => {
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
    resetReadings,    // chama ao iniciar treino
    isMobileOnline: status === 'flutter_connected',
  };
}
