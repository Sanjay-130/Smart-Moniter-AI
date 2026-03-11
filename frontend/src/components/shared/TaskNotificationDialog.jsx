import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Typography,
    Box,
    Stack,
    Divider,
    Grid
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, DoneAll as DoneAllIcon, Circle as CircleIcon } from '@mui/icons-material';
import { useGetMyTasksQuery, useCompleteTaskMutation, useMarkTaskReadMutation, useMarkAllTasksReadMutation } from 'src/slices/tasksApiSlice';
import Loader from 'src/views/authentication/Loader';

const TaskNotificationDialog = ({ open, onClose }) => {
    const { data: tasks, isLoading, refetch } = useGetMyTasksQuery(undefined, {
        skip: !open, // Only fetch when open
        refetchOnMountOrArgChange: true
    });

    const [completeTask] = useCompleteTaskMutation();
    const [markTaskRead] = useMarkTaskReadMutation();
    const [markAllRead] = useMarkAllTasksReadMutation();

    const handleComplete = async (taskId) => {
        await completeTask(taskId).unwrap();
        refetch();
    };

    const handleMarkRead = async (taskId) => {
        await markTaskRead(taskId).unwrap();
        refetch();
    };

    const handleMarkAllRead = async () => {
        await markAllRead().unwrap();
        refetch();
    };

    if (isLoading) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
                My Tasks & Notifications
                {tasks?.some(t => !t.isRead) && (
                    <Button
                        size="small"
                        startIcon={<DoneAllIcon />}
                        onClick={handleMarkAllRead}
                    >
                        Mark All Read
                    </Button>
                )}
            </DialogTitle>
            <DialogContent dividers>
                {tasks && tasks.length > 0 ? (
                    <List>
                        {tasks.map((task, index) => (
                            <React.Fragment key={task._id}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        bgcolor: task.isRead ? 'transparent' : 'action.hover',
                                        borderRadius: 1,
                                        mb: 1,
                                        flexDirection: 'column',
                                        alignItems: 'stretch'
                                    }}
                                    onMouseEnter={() => !task.isRead && handleMarkRead(task._id)}
                                >
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={1}>
                                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                                {!task.isRead && <CircleIcon color="error" sx={{ fontSize: 12 }} />}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" fontWeight={task.isRead ? 500 : 700}>
                                                        {task.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <React.Fragment>
                                                        <Typography variant="body2" color="text.primary" sx={{ my: 0.5, display: 'block' }}>
                                                            {task.description}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Assigned: {new Date(task.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </React.Fragment>
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {task.status === 'pending' ? (
                                                    <Button
                                                        variant="outlined"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<CheckCircleIcon />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleComplete(task._id);
                                                        }}
                                                    >
                                                        Complete
                                                    </Button>
                                                ) : (
                                                    <Chip label="Completed" color="success" size="small" icon={<CheckCircleIcon />} />
                                                )}
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                                {index < tasks.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box py={4} textAlign="center">
                        <Typography color="text.secondary">No tasks assigned yet.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskNotificationDialog;
