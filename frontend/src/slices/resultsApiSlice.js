import { apiSlice } from './apiSlice';
import Cookies from 'js-cookie';

const RESULTS_URL = '/api/results';

const resultsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResults: builder.query({
      query: () => {
        console.log('Fetching results...');
        return {
          url: `${RESULTS_URL}/student`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('jwt')}`,
          },
          credentials: 'include',
        };
      },
      providesTags: ['Results'],
      keepUnusedDataFor: 5,
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          console.log('Results fetched successfully:', data);
        } catch (error) {
          console.error('Error in getResults query:', error);
        }
      },
    }),
    getExamResult: builder.query({
      query: (examId) => ({
        url: `${RESULTS_URL}/exam/${examId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        credentials: 'include',
      }),
      providesTags: (result, error, examId) => [{ type: 'Results', examId }],
      keepUnusedDataFor: 5,
    }),
    getExamResultsForTeacher: builder.query({
      query: (examId) => ({
        url: `${RESULTS_URL}/teacher/exam/${examId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        credentials: 'include',
      }),
      providesTags: (result, error, examId) => [{ type: 'TeacherResults', examId }],
      keepUnusedDataFor: 5,
    }),
    saveResult: builder.mutation({
      query: (data) => ({
        url: `${RESULTS_URL}`,
        method: 'POST',
        body: data,
        headers: {
          'Authorization': `Bearer ${Cookies.get('jwt')}`,
        },
        credentials: 'include',
      }),
      invalidatesTags: ['Results'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetResultsQuery,
  useGetExamResultQuery,
  useGetExamResultsForTeacherQuery,
  useSaveResultMutation,
} = resultsApiSlice;

// Custom hook with enhanced error handling
export const useGetResults = () => {
  const { 
    data, 
    error, 
    isLoading, 
    isError,
    isSuccess,
    refetch 
  } = useGetResultsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Log the state for debugging
  if (isError) {
    console.error('Error in useGetResults:', error);
  } else if (isSuccess) {
    console.log('Results loaded successfully:', data);
  }
  
  return {
    results: data || [],
    isLoading,
    isError,
    isSuccess,
    error: error ? 
      (error.data?.message || error.error || 'Failed to fetch results') : 
      null,
    refetch,
  };
};
