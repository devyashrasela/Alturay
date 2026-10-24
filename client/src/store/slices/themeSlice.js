import { createSlice } from '@reduxjs/toolkit';

export const THEME_STORAGE_KEY = 'alturay_theme';
export const DEFAULT_THEME = 'dark';
const THEMES = ['light', 'dark'];

export const normalizeTheme = (value) => (THEMES.includes(value) ? value : DEFAULT_THEME);

export const applyTheme = (value) => {
  const theme = normalizeTheme(value);
  document.documentElement.setAttribute('data-theme', theme);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', theme === 'light' ? '#F7F7F8' : '#121212');
  }

  return theme;
};

const getStoredTheme = () => {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
};

const persistTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the in-memory theme still works.
  }
};

const initialTheme = applyTheme(getStoredTheme());

const initialState = {
  currentTheme: initialTheme,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      const theme = applyTheme(action.payload);
      state.currentTheme = theme;
      persistTheme(theme);
    },
    toggleTheme: (state) => {
      const theme = applyTheme(state.currentTheme === 'light' ? 'dark' : 'light');
      state.currentTheme = theme;
      persistTheme(theme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
