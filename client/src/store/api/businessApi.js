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
      query: (arg) => {
        if (typeof arg === 'string') {
          return `/businesses/check-qr-prefix?prefix=${encodeURIComponent(arg)}`;
        }
        const { prefix, excludeId } = arg || {};
        let url = `/businesses/check-qr-prefix?prefix=${encodeURIComponent(prefix || '')}`;
        if (excludeId) url += `&excludeId=${encodeURIComponent(excludeId)}`;
        return url;
      },
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
