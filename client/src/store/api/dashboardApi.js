import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: (businessId) => `/businesses/${businessId}/dashboard/stats`,
      providesTags: ['Dashboard'],
    }),
    getRecentInvoices: builder.query({
      query: (businessId) => `/businesses/${businessId}/dashboard/recent`,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } = dashboardApi;
