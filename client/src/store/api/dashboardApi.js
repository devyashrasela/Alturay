import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: (arg) => {
        if (typeof arg === 'object' && arg !== null) {
          const { businessId, month, startDate, endDate } = arg;
          const params = new URLSearchParams();
          if (month) params.set('month', month);
          if (startDate) params.set('startDate', startDate);
          if (endDate) params.set('endDate', endDate);
          const qs = params.toString();
          return `/businesses/${businessId}/dashboard/stats${qs ? `?${qs}` : ''}`;
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
