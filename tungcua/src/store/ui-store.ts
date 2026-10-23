import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  type ScriptVariant,
  type ThemeMode,
} from '../shared/storage/types';

export interface UiState {
  theme: ThemeMode;
  fontSize: number;
  scriptVariant: ScriptVariant;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (fontSize: number) => void;
  setScriptVariant: (scriptVariant: ScriptVariant) => void;
  hydrate: (settings: {
    theme: ThemeMode;
    fontSize: number;
    scriptVariant: ScriptVariant;
  }) => void;
}

/**
 * UI-only state (Zustand), per FR-013. Persisted values are read from the
 * `DocumentStore`; this store just holds the current, reactive copy.
 */
export const useUiStore = create<UiState>((set) => ({
  theme: DEFAULT_SETTINGS.theme,
  fontSize: DEFAULT_SETTINGS.fontSize,
  scriptVariant: DEFAULT_SETTINGS.scriptVariant,
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setScriptVariant: (scriptVariant) => set({ scriptVariant }),
  hydrate: (settings) => set({ ...settings }),
}));

/** Test hook: restore the default UI settings. */
export function resetUiStore(): void {
  useUiStore.setState({
    theme: DEFAULT_SETTINGS.theme,
    fontSize: DEFAULT_SETTINGS.fontSize,
    scriptVariant: DEFAULT_SETTINGS.scriptVariant,
  });
}
