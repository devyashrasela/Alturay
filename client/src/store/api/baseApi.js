import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8001/api',
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
