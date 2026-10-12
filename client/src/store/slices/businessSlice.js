import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeBusinessId: localStorage.getItem('alturay_active_business') || null,
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
      localStorage.setItem('alturay_active_business', action.payload.id);
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
      localStorage.removeItem('alturay_active_business');
    },
  },
});

export const { setBusinesses, setActiveBusiness, addBusiness, updateBusinessInList, clearBusiness } = businessSlice.actions;
export default businessSlice.reducer;
