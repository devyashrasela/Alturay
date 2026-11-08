import { baseApi } from './baseApi';

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: ({ businessId, page = 1, limit = 20, search = '', all = false }) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (search) params.append('search', search);
        if (all) params.append('all', 'true');
        return `/businesses/${businessId}/customers?${params.toString()}`;
      },
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query({
      query: ({ businessId, customerId }) =>
        `/businesses/${businessId}/customers/${customerId}`,
      providesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),
    createCustomer: builder.mutation({
      query: ({ businessId, ...body }) => ({
        url: `/businesses/${businessId}/customers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: ({ businessId, customerId, ...body }) => ({
        url: `/businesses/${businessId}/customers/${customerId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: ({ businessId, customerId }) => ({
        url: `/businesses/${businessId}/customers/${customerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
