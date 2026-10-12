import { baseApi } from './baseApi';

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: ({ businessId, page = 1, limit = 20, type, status, search = '' }) => {
        let url = `/businesses/${businessId}/invoices?page=${page}&limit=${limit}&search=${search}`;
        if (type) url += `&type=${type}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: ({ businessId, invoiceId }) =>
        `/businesses/${businessId}/invoices/${invoiceId}`,
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation({
      query: ({ businessId, ...body }) => ({
        url: `/businesses/${businessId}/invoices`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    updateInvoice: builder.mutation({
      query: ({ businessId, invoiceId, ...body }) => ({
        url: `/businesses/${businessId}/invoices/${invoiceId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoiceStatus: builder.mutation({
      query: ({ businessId, invoiceId, status }) => ({
        url: `/businesses/${businessId}/invoices/${invoiceId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
} = invoiceApi;
