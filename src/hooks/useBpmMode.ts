import { useState, useEffect } from 'react';

export type BpmMode = 'sensor' | 'manual';

interface UseBpmModeOptions {
  isMobileOnline: boolean;
}

export function useBpmMode({ isMobileOnline }: UseBpmModeOptions) {
  // Começa sem modo selecionado — usuário escolhe ao entrar na fase during
  const [mode, setMode] = useState<BpmMode | null>(null);

  // Se o Flutter conectar depois que o usuário escolheu "manual",
  // NÃO troca automaticamente — só disponibiliza o botão de sensor.
  // Se o Flutter desconectar enquanto está no modo "sensor",
  // volta pro modo manual automaticamente.
  useEffect(() => {
    if (!isMobileOnline && mode === 'sensor') {
      setMode('manual');
    }
  }, [isMobileOnline]);

  const selectSensor = () => setMode('sensor');
  const selectManual = () => setMode('manual');

  return {
    mode,
    selectSensor,
    selectManual,
    // True quando o usuário ainda não escolheu o modo
    isSelecting: mode === null,
  };
}
