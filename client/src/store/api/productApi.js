import { baseApi } from './baseApi';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ businessId, page = 1, limit = 20, search = '' }) =>
        `/businesses/${businessId}/products?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: ({ businessId, ...body }) => ({
        url: `/businesses/${businessId}/products`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    updateProduct: builder.mutation({
      query: ({ businessId, productId, ...body }) => ({
        url: `/businesses/${businessId}/products/${productId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: ({ businessId, productId }) => ({
        url: `/businesses/${businessId}/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;
