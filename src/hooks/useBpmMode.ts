import { useState, useEffect } from 'react';

export type BpmMode = 'sensor' | 'magene' | 'manual';

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

  // Além de trocar o modo na UI, dispara a ponte nativa: é ela quem realmente
  // chama healthManager.connect() + requestHeartRatePermission() do lado
  // Kotlin. Sem isso, o modo "sensor" fica selecionado no React mas o SDK
  // nunca é acionado e a permissão nunca é solicitada.
  const selectSensor = () => {
    setMode('sensor');
    window.AndroidNative?.disconnectMageneSensor?.();
    window.AndroidNative?.connectSensor?.();
  };

  // Mesma ideia do selectSensor, mas pro sensor BLE genérico (Magene H003):
  // dispara o scan+conexão nativos e garante que o Samsung Health não fique
  // rodando em paralelo (só uma fonte automática ativa por vez).
  const selectMagene = () => {
    setMode('magene');
    window.AndroidNative?.disconnectSensor?.();
    window.AndroidNative?.connectMageneSensor?.();
  };

  const selectManual = () => {
    setMode('manual');
    window.AndroidNative?.disconnectSensor?.();
    window.AndroidNative?.disconnectMageneSensor?.();
  };

  return {
    mode,
    selectSensor,
    selectMagene,
    selectManual,
    isSelecting: mode === null,
  };
}