import { createSlice } from '@reduxjs/toolkit';
import { setActiveBusiness, clearBusiness } from './businessSlice';
import { logout } from './authSlice';

let toastId = 0;

const closedDock = {
  open: false,
  wide: false,
  type: null,
  data: null,
};

const initialState = {
  sidebarOpen: true,
  toasts: [],
  dock: { ...closedDock },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action) => {
      toastId += 1;
      state.toasts.push({
        id: toastId,
        type: action.payload.type || 'info',
        message: action.payload.message,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    openDock: (state, action) => {
      state.dock.open = true;
      state.dock.type = action.payload?.type || action.payload;
      state.dock.data = action.payload?.data || null;
    },
    closeDock: (state) => {
      Object.assign(state.dock, closedDock);
    },
    toggleDockWide: (state) => {
      state.dock.wide = !state.dock.wide;
    },
    setDockWide: (state, action) => {
      state.dock.wide = Boolean(action.payload);
    },
    updateDockData: (state, action) => {
      if (state.dock.data) {
        state.dock.data = { ...state.dock.data, ...action.payload };
      } else {
        state.dock.data = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Auto-close dock when the active workspace changes
    builder.addCase(setActiveBusiness, (state) => {
      Object.assign(state.dock, closedDock);
    });
    // Auto-close dock when workspaces are cleared
    builder.addCase(clearBusiness, (state) => {
      Object.assign(state.dock, closedDock);
    });
    // Auto-close dock on logout
    builder.addCase(logout, (state) => {
      Object.assign(state.dock, closedDock);
    });
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  openDock,
  closeDock,
  toggleDockWide,
  setDockWide,
  updateDockData,
} = uiSlice.actions;
export default uiSlice.reducer;
