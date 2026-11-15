import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import businessReducer from './slices/businessSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';
import { baseApi } from './api/baseApi';
import { setActiveBusiness, clearBusiness } from './slices/businessSlice';

const businessCacheMiddleware = createListenerMiddleware();

businessCacheMiddleware.startListening({
  actionCreator: setActiveBusiness,
  effect: (action, listenerApi) => {
    const previousId = listenerApi.getOriginalState().business.activeBusinessId;
    if (previousId !== action.payload?.id) {
      listenerApi.dispatch(baseApi.util.resetApiState());
    }
  },
});

businessCacheMiddleware.startListening({
  actionCreator: clearBusiness,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    theme: themeReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(businessCacheMiddleware.middleware)
      .concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export default store;
