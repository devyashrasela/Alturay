import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: (arg) => {
        if (typeof arg === 'object' && arg !== null) {
          const { businessId, month } = arg;
          return `/businesses/${businessId}/dashboard/stats${month ? `?month=${month}` : ''}`;
        }
        return `/businesses/${arg}/dashboard/stats`;
      },
      providesTags: ['Dashboard'],
    }),
    getRecentInvoices: builder.query({
      query: (businessId) => `/businesses/${businessId}/dashboard/recent`,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } = dashboardApi;
