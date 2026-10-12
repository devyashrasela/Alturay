import { baseApi } from './baseApi';

export const businessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinesses: builder.query({
      query: () => '/businesses',
      providesTags: ['Business'],
    }),
    createBusiness: builder.mutation({
      query: (body) => ({ url: '/businesses', method: 'POST', body }),
      invalidatesTags: ['Business'],
    }),
    updateBusiness: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/businesses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Business'],
    }),
  }),
});

export const { useGetBusinessesQuery, useCreateBusinessMutation, useUpdateBusinessMutation } = businessApi;
