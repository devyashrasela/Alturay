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
      invalidatesTags: ['Business', 'Dashboard'],
    }),
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/image',
        method: 'POST',
        body: formData,
      }),
    }),
    checkQrPrefix: builder.query({
      query: (prefix) => `/businesses/check-qr-prefix?prefix=${encodeURIComponent(prefix)}`,
    }),
  }),
});

export const {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useUploadImageMutation,
  useLazyCheckQrPrefixQuery,
} = businessApi;
