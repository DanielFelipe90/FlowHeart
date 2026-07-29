import { useState, useEffect } from 'react';

export type BpmMode = 'sensor' | 'manual';

interface UseBpmModeOptions {
  isMobileOnline: boolean;
}

export function useBpmMode({ isMobileOnline }: UseBpmModeOptions) {
  const [mode, setMode] = useState<BpmMode | null>(null);

  // Auto-seleciona na montagem/detecção inicial do sensor
  useEffect(() => {
    if (mode === null) {
      if (isMobileOnline) {
        setMode('sensor');
      } else {
        setMode('manual');
      }
    }
  }, [isMobileOnline, mode]);

  // Se o mobile desconectar enquanto está no modo "sensor",
  // volta pro modo manual automaticamente.
  useEffect(() => {
    if (!isMobileOnline && mode === 'sensor') {
      setMode('manual');
    }
  }, [isMobileOnline, mode]);

  const selectSensor = () => setMode('sensor');
  const selectManual = () => setMode('manual');

  return {
    mode,
    selectSensor,
    selectManual,
    isSelecting: mode === null,
  };
}