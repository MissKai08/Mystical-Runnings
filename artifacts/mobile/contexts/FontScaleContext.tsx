import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  loadFontScaleIndex,
  saveFontScaleIndex,
  fontScaleFromIndex,
  MAX_SCALE_INDEX,
  DEFAULT_SCALE_INDEX,
} from "@/utils/fontScale";

interface FontScaleContextValue {
  scaleIdx: number;
  fontScale: number;
  fs: (n: number) => number;
  handleScaleChange: (delta: number) => void;
}

const FontScaleContext = createContext<FontScaleContextValue>({
  scaleIdx: DEFAULT_SCALE_INDEX,
  fontScale: 1.0,
  fs: (n) => n,
  handleScaleChange: () => {},
});

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [scaleIdx, setScaleIdx] = useState(DEFAULT_SCALE_INDEX);

  useEffect(() => {
    loadFontScaleIndex().then(setScaleIdx);
  }, []);

  const fontScale = useMemo(() => fontScaleFromIndex(scaleIdx), [scaleIdx]);
  const fs = useCallback((n: number) => Math.round(n * fontScale), [fontScale]);

  const handleScaleChange = useCallback((delta: number) => {
    setScaleIdx((prev) => {
      const next = Math.max(0, Math.min(MAX_SCALE_INDEX, prev + delta));
      saveFontScaleIndex(next);
      return next;
    });
    Haptics.selectionAsync();
  }, []);

  return (
    <FontScaleContext.Provider value={{ scaleIdx, fontScale, fs, handleScaleChange }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
