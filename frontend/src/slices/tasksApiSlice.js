import { apiSlice } from './apiSlice';

const TASKS_URL = '/api/tasks';

export const tasksApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Admin: Create Task
        createTask: builder.mutation({
            query: (data) => ({
                url: `${TASKS_URL}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Tasks', 'AdminTasks'],
        }),
        // Admin: Get All Tasks
        getAllTasks: builder.query({
            query: () => ({
                url: `${TASKS_URL}/admin/all`,
                method: 'GET',
            }),
            providesTags: ['AdminTasks'],
        }),
        // Teacher: Get My Tasks
        getMyTasks: builder.query({
            query: () => ({
                url: `${TASKS_URL}/my`,
                method: 'GET',
            }),
            providesTags: ['Tasks'],
        }),
        // Teacher: Complete Task
        completeTask: builder.mutation({
            query: (taskId) => ({
                url: `${TASKS_URL}/${taskId}/complete`,
                method: 'PUT',
            }),
            invalidatesTags: ['Tasks', 'AdminTasks'],
        }),
        // Teacher: Mark Task Read
        markTaskRead: builder.mutation({
            query: (taskId) => ({
                url: `${TASKS_URL}/${taskId}/read`,
                method: 'PUT',
            }),
            invalidatesTags: ['Tasks'],
        }),
        // Teacher: Mark All Read (Optional for convenience)
        markAllTasksRead: builder.mutation({
            query: () => ({
                url: `${TASKS_URL}/read-all`,
                method: 'PUT',
            }),
            invalidatesTags: ['Tasks'],
        }),
        // Admin: Delete Task
        deleteTask: builder.mutation({
            query: (taskId) => ({
                url: `${TASKS_URL}/${taskId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminTasks'],
        }),
    }),
});

export const {
    useCreateTaskMutation,
    useGetAllTasksQuery,
    useGetMyTasksQuery,
    useCompleteTaskMutation,
    useMarkTaskReadMutation,
    useMarkAllTasksReadMutation,
    useDeleteTaskMutation,
} = tasksApiSlice;
