import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const EXAMS_URL = '/api/exams';

// Inject endpoints for the exam slice
export const cheatingLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get cheating logs for a specific exam
    getCheatingLogs: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/cheatingLogs/${examId}`, // Updated route
        method: 'GET',
      }),
      providesTags: (result, error, examId) =>
        result
          ? [
            { type: 'CheatingLogs', id: examId },
            ...result.map((r) => ({ type: 'CheatingLogs', id: r._id })),
          ]
          : [{ type: 'CheatingLogs', id: examId }],
    }),
    // Save a new cheating log entry for an exam
    saveCheatingLog: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/cheatingLogs`, // Updated route
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) =>
        arg && arg.examId ? [{ type: 'CheatingLogs', id: arg.examId }] : ['CheatingLogs'],
    }),
    // Delete a cheating log entry by id (teacher only)
    deleteCheatingLog: builder.mutation({
      query: ({ id }) => ({
        url: `${EXAMS_URL}/cheatingLogs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => {
        const tags = [];
        if (arg?.id) tags.push({ type: 'CheatingLogs', id: arg.id });
        if (arg?.examId) tags.push({ type: 'CheatingLogs', id: arg.examId });
        return tags.length ? tags : ['CheatingLogs'];
      },
    }),
    // Get current student's own cheating logs
    getMyCheatingLogs: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/my-cheatingLogs`,
        method: 'GET',
      }),
      providesTags: ['CheatingLogs'],
    }),
    getAllCheatingLogs: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/cheatingLogs/all`,
        method: 'GET',
      }),
      providesTags: ['CheatingLogs'],
    }),
  }),
});

// Export the generated hooks for each endpoint
export const {
  useGetCheatingLogsQuery,
  useSaveCheatingLogMutation,
  useDeleteCheatingLogMutation,
  useGetMyCheatingLogsQuery,
  useGetAllCheatingLogsQuery
} = cheatingLogApiSlice;
