import { createSlice } from '@reduxjs/toolkit';

const getStoredBusinessId = () => {
  try {
    return localStorage.getItem('alturay_active_business') || null;
  } catch {
    return null;
  }
};

const persistBusinessId = (id) => {
  try {
    localStorage.setItem('alturay_active_business', id);
  } catch {
    // Storage can be unavailable; Redux remains the source of truth.
  }
};

const removeStoredBusinessId = () => {
  try {
    localStorage.removeItem('alturay_active_business');
  } catch {
    // Storage can be unavailable; Redux remains the source of truth.
  }
};

const initialState = {
  activeBusinessId: getStoredBusinessId(),
  activeBusiness: null,
  businesses: [],
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusinesses: (state, action) => {
      state.businesses = action.payload;
    },
    setActiveBusiness: (state, action) => {
      state.activeBusinessId = action.payload.id;
      state.activeBusiness = action.payload;
      persistBusinessId(action.payload.id);
    },
    addBusiness: (state, action) => {
      state.businesses.push(action.payload);
    },
    updateBusinessInList: (state, action) => {
      const index = state.businesses.findIndex(b => b.id === action.payload.id);
      if (index !== -1) state.businesses[index] = action.payload;
      if (state.activeBusinessId === action.payload.id) {
        state.activeBusiness = action.payload;
      }
    },
    clearBusiness: (state) => {
      state.activeBusinessId = null;
      state.activeBusiness = null;
      state.businesses = [];
      removeStoredBusinessId();
    },
  },
});

export const { setBusinesses, setActiveBusiness, addBusiness, updateBusinessInList, clearBusiness } = businessSlice.actions;
export default businessSlice.reducer;
