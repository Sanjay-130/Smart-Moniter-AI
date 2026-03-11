import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import { useCreateTaskMutation } from 'src/slices/tasksApiSlice';
import { toast } from 'react-toastify';

const AdminTaskAssigner = ({ open, onClose, teachers }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    const [createTask, { isLoading }] = useCreateTaskMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTask({ title, description, assignedTo }).unwrap();
            toast.success('Task assigned successfully!');
            setTitle('');
            setDescription('');
            setAssignedTo('');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to assign task');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 0 } }}
        >
            <DialogTitle>Assign Task to Teacher</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Teacher</InputLabel>
                                <Select
                                    value={assignedTo}
                                    label="Select Teacher"
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    sx={{ borderRadius: 0 }}
                                >
                                    {teachers.map((teacher) => (
                                        <MenuItem key={teacher._id} value={teacher._id}>
                                            {teacher.name} ({teacher.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Task Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                InputProps={{ sx: { borderRadius: 0 } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Task Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                InputProps={{ sx: { borderRadius: 0 } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} sx={{ borderRadius: 0 }}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isLoading} sx={{ borderRadius: 0, boxShadow: 'none' }}>
                        {isLoading ? 'Assigning...' : 'Assign Task'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AdminTaskAssigner;
