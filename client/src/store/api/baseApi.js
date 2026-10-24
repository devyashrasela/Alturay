import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.API_URL;

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      const activeBusinessId = getState().business.activeBusinessId;

      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (activeBusinessId) headers.set('X-Business-Id', activeBusinessId);

      return headers;
    },
  }),
  tagTypes: ['Business', 'Product', 'Invoice', 'Dashboard'],
  endpoints: () => ({}),
});
