import { baseApi } from './baseApi';

export const membersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccess: builder.query({
      query: (businessId) => `/businesses/${businessId}/access`,
      providesTags: ['Access'],
    }),
    getRoles: builder.query({
      query: (businessId) => `/businesses/${businessId}/roles`,
      providesTags: ['Roles'],
    }),
    getMembers: builder.query({
      query: (businessId) => `/businesses/${businessId}/members`,
      providesTags: ['Member'],
    }),
    addMember: builder.mutation({
      query: ({ businessId, email, role }) => ({
        url: `/businesses/${businessId}/members`,
        method: 'POST',
        body: { email, role },
      }),
      invalidatesTags: ['Member'],
    }),
    updateMemberRole: builder.mutation({
      query: ({ businessId, memberId, role }) => ({
        url: `/businesses/${businessId}/members/${memberId}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Member'],
    }),
    removeMember: builder.mutation({
      query: ({ businessId, memberId }) => ({
        url: `/businesses/${businessId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Member'],
    }),
    leaveBusiness: builder.mutation({
      query: (businessId) => ({
        url: `/businesses/${businessId}/members/me`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Business', 'Access', 'Member'],
    }),
  }),
});

export const {
  useGetAccessQuery,
  useGetRolesQuery,
  useGetMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useLeaveBusinessMutation,
} = membersApi;
