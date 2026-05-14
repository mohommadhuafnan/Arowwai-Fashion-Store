import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeConfig, ThemeMode, AccentColor, DEFAULT_THEME, loadTheme, saveTheme, applyThemeToDOM } from '@/lib/theme';

const initialState: ThemeConfig = DEFAULT_THEME;

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    hydrateTheme: () => {
      const saved = loadTheme();
      applyThemeToDOM(saved);
      return saved;
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      saveTheme(state);
      applyThemeToDOM(state);
    },
    setAccentColor: (state, action: PayloadAction<AccentColor>) => {
      state.accent = action.payload;
      saveTheme(state);
      applyThemeToDOM(state);
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
      saveTheme(state);
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
      saveTheme(state);
    },
    updateTheme: (state, action: PayloadAction<Partial<ThemeConfig>>) => {
      Object.assign(state, action.payload);
      saveTheme(state);
      applyThemeToDOM(state);
    },
  },
});

export const { hydrateTheme, setThemeMode, setAccentColor, setCurrency, setTimezone, updateTheme } = themeSlice.actions;
export default themeSlice.reducer;
