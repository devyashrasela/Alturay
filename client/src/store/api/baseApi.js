import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearBusiness } from '../slices/businessSlice';
import { addToast } from '../slices/uiSlice';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : '/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    const activeBusinessId = getState().business.activeBusinessId;

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (activeBusinessId) headers.set('X-Business-Id', activeBusinessId);

    return headers;
  },
});

const baseQueryWithAuthHandling = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 403) {
    const errorCode = result.error.data?.error?.code;
    const errorMessage = result.error.data?.error?.message;

    if (errorCode === 'NOT_A_MEMBER') {
      api.dispatch(clearBusiness());
      api.dispatch(
        addToast({
          type: 'error',
          message: 'You no longer have access to this business.',
        })
      );
    } else if (errorCode === 'INSUFFICIENT_ROLE') {
      api.dispatch(baseApi.util.invalidateTags(['Access']));
      api.dispatch(
        addToast({
          type: 'error',
          message: errorMessage || 'Your role does not allow this action.',
        })
      );
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthHandling,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Business',
    'Product',
    'Customer',
    'Invoice',
    'Dashboard',
    'Member',
    'Access',
    'Roles',
  ],
  endpoints: () => ({}),
});
