import React, { useMemo, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Chip,
    Alert,
    Tabs,
    Tab,
    Stack,
    Checkbox,
    FormControlLabel,
    Divider,
    List,
    ListItem,
    ListItemText,
    Tooltip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Avatar,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon, LockOpen as LockOpenIcon, Lock as LockIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from 'src/slices/authSlice';
import PageContainer from 'src/components/container/PageContainer';
import { useGetAllCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import { 
    useGetAllUsersQuery, 
    useDeleteUserMutation, 
    useRegisterMutation, 
    useUnblockUserMutation, 
    useBlockUserMutation, 
    useLazyGetStudentHistoryQuery, 
    useBulkRegisterMutation 
} from 'src/slices/usersApiSlice';
import { useGetAllTasksQuery, useDeleteTaskMutation } from 'src/slices/tasksApiSlice';
import AdminTaskAssigner from './AdminTaskAssigner';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { 
    Upload as UploadIcon, 
    FileDownload as DownloadIcon, 
    People as PeopleIcon, 
    School as StudentIcon, 
    SupervisorAccount as TeacherIcon, 
    ReportProblem as ViolationIcon 
} from '@mui/icons-material';

const userValidationSchema = yup.object({
    name: yup.string().min(2).max(25).required('Please enter name'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    rollNumber: yup.string().when('role', {
        is: 'student',
        then: (schema) => schema.required('Roll number is required for students'),
        otherwise: (schema) => schema.notRequired(),
    }),
    password: yup
        .string()
        .min(6, 'Password should be of minimum 6 characters length')
        .required('Password is required'),
    role: yup.string().oneOf(['student', 'teacher'], 'Invalid role').required('Role is required'),
    dob: yup.date()
        .required('Date of birth is required')
        .test('age-validation', 'Invalid age for selected role', function(value) {
            if (!value) return false;
            const ageDiff = Date.now() - new Date(value).getTime();
            const ageDate = new Date(Math.abs(ageDiff));
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            
            const role = this.parent.role;
            if (role === 'student' && age < 18) {
                return this.createError({ message: 'Student must be at least 18 years old' });
            }
            if (role === 'teacher' && age < 23) {
                return this.createError({ message: 'Teacher must be at least 23 years old' });
            }
            return true;
        }),
});

const SummaryCard = ({ title, value, icon, color }) => (
    <Card sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
        <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, borderRadius: 0 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={700}>{value}</Typography>
                    <Typography variant="caption" color="textSecondary">{title}</Typography>
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

const AdminPage = () => {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [openAssignTaskDialog, setOpenAssignTaskDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { data: users, isLoading, refetch } = useGetAllUsersQuery();
    const { data: tasks, isLoading: isTasksLoading, refetch: refetchTasks } = useGetAllTasksQuery(undefined, {
        pollingInterval: 30000,
        refetchOnMountOrArgChange: true
    });
    const { data: allLogs, isLoading: isLogsLoading } = useGetAllCheatingLogsQuery();

    const [deleteTask] = useDeleteTaskMutation();
    const [deleteUser] = useDeleteUserMutation();
    const [register, { isLoading: isRegistering }] = useRegisterMutation();
    const [bulkRegister, { isLoading: isBulkRegistering }] = useBulkRegisterMutation();

    const [tab, setTab] = useState('students');
    const [query, setQuery] = useState('');

    const handleAdminLogout = () => {
        localStorage.removeItem('isAdmin');
        dispatch(logout()); // Clear Redux state
        navigate('/auth/login');
    };

    const handleDownloadTemplate = () => {
        const csvContent = "name,email,rollNumber,password,role,dob\nJohn Doe,john@example.com,S001,password123,student,2005-01-01\nJane Smith,jane@teacher.com,,password123,teacher,1985-01-01";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bulk_user_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) {
                toast.error('CSV file is empty or missing headers');
                return;
            }
            const headers = rows[0].split(',').map(h => {
                let header = h.trim().toLowerCase();
                if (header === 'rollnumber') return 'rollNumber';
                return header;
            });
            
            const usersToRegister = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                const user = {};
                headers.forEach((header, index) => {
                    if (values[index] !== '') {
                        user[header] = values[index];
                    }
                });
                return user;
            });

            try {
                const res = await bulkRegister({ users: usersToRegister }).unwrap();
                toast.success(res.message);
                setOpenBulkDialog(false);
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || 'Bulk upload failed');
            }
        };
        reader.readAsText(file);
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            rollNumber: '',
            dob: '',
            password: '',
            role: 'student',
        },
        validationSchema: userValidationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = { ...values };
                await register(payload).unwrap();
                toast.success('User created successfully!');
                resetForm();
                setOpenCreateDialog(false);
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || err.error || 'Failed to create user');
            }
        },
    });

    const [unblockUser] = useUnblockUserMutation();
    const [blockUser] = useBlockUserMutation();
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [triggerHistory, { data: historyData, isFetching: isHistoryLoading }] = useLazyGetStudentHistoryQuery();
    const [resetCount, setResetCount] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(true);

    const handleOpenProfile = (student, viewOnly = true) => {
        setIsViewOnly(viewOnly);
        setSelectedStudent(student);
        setResetCount(false);
        setOpenHistoryDialog(true);
        triggerHistory({ rollNumber: student.rollNumber });
    };

    const handleUnblockUser = async () => {
        if (!selectedStudent) return;
        try {
            await unblockUser({ rollNumber: selectedStudent.rollNumber, resetCount }).unwrap();
            toast.success(`Unblocked ${selectedStudent.name}!`);
            setOpenHistoryDialog(false);
            setSelectedStudent(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to unblock');
        }
    };
    const handleBlockUser = async (student) => {
        try {
            await blockUser({ rollNumber: student.rollNumber }).unwrap();
            toast.warning(`Blocked ${student.name}`);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to block');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId).unwrap();
            toast.success('User deleted successfully!');
            setDeleteConfirm(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || err.error || 'Failed to delete user');
        }
    };

    const handleDeleteTask = async () => {
        if (!deleteTaskConfirm) return;
        try {
            await deleteTask(deleteTaskConfirm).unwrap();
            toast.success('Task deleted');
            refetchTasks();
            setDeleteTaskConfirm(null);
        } catch (err) {
            toast.error('Failed to delete task');
        }
    };

    const studentCount = users?.filter(u => u.role === 'student').length || 0;
    const teacherCount = users?.filter(u => u.role === 'teacher').length || 0;
    const totalViolations = allLogs?.length || 0;

    return (
        <PageContainer title="Admin Dashboard" description="Full control center">
            <Box>
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Students" value={studentCount} icon={<StudentIcon />} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Teachers" value={teacherCount} icon={<TeacherIcon />} color="secondary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Tasks" value={tasks?.length || 0} icon={<PeopleIcon />} color="info" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Recent Violations" value={totalViolations} icon={<ViolationIcon />} color="error" />
                    </Grid>
                </Grid>

                <Card sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems="center" mb={4}>
                            <Typography variant="h4" fontWeight={700}>System Control Center</Typography>
                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { refetch(); refetchTasks(); }} sx={{ px: 3, borderRadius: 0 }}>Refresh</Button>
                                <Button variant="contained" color="warning" startIcon={<UploadIcon />} onClick={() => setOpenBulkDialog(true)} sx={{ px: 3, borderRadius: 0, boxShadow: 'none' }}>Bulk Upload</Button>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)} sx={{ px: 3, borderRadius: 0, boxShadow: 'none' }}>Create Account</Button>
                                <Button variant="outlined" color="error" onClick={handleAdminLogout} sx={{ px: 3, borderRadius: 0 }}>Logout</Button>
                            </Stack>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" mb={3}>
                            <Tabs
                                value={tab}
                                onChange={(_, v) => setTab(v)}
                                sx={{
                                    flexShrink: 0,
                                    '& .MuiTab-root': { fontSize: '1rem', minHeight: 48, textTransform: 'none', borderRadius: 0 }
                                }}
                            >
                                <Tab value="students" label="Students" sx={{ borderRadius: 0 }} />
                                <Tab value="teachers" label="Teachers" sx={{ borderRadius: 0 }} />
                                <Tab value="tasks" label="Tasks" sx={{ borderRadius: 0 }} />
                                <Tab value="activity" label="Activity Log" sx={{ borderRadius: 0 }} />
                                <Tab value="blocked" label="Blocked" sx={{ color: 'error.main', borderRadius: 0 }} />
                            </Tabs>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box sx={{ position: 'relative', width: { xs: '100%', md: 360 } }}>
                                <TextField
                                    fullWidth
                                    placeholder="Search..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                                        sx: { borderRadius: 0 }
                                    }}
                                />
                            </Box>
                        </Stack>

                        {tab === 'tasks' ? (
                            <TasksGrid tasks={tasks} loading={isTasksLoading} onDelete={(id) => setDeleteTaskConfirm(id)} onAssign={() => setOpenAssignTaskDialog(true)} />
                        ) : tab === 'activity' ? (
                            <ActivityGrid logs={allLogs} loading={isLogsLoading} />
                        ) : isLoading ? (
                            <Typography>Loading...</Typography>
                        ) : (
                            <UsersGrid
                                users={users || []}
                                tab={tab}
                                query={query}
                                onAskDelete={(u) => setDeleteConfirm(u)}
                                onAskProfile={(u, viewOnly) => handleOpenProfile(u, viewOnly)}
                                onAskBlock={(u) => handleBlockUser(u)}
                            />
                        )}
                    </CardContent>
                </Card>
            </Box>

            <AdminTaskAssigner
                open={openAssignTaskDialog}
                onClose={() => { setOpenAssignTaskDialog(false); refetchTasks(); }}
                teachers={users?.filter(u => u.role === 'teacher') || []}
            />

            {/* Bulk Upload Dialog */}
            <Dialog
                open={openBulkDialog}
                onClose={() => setOpenBulkDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 0 } }}
            >
                <DialogTitle>Bulk Upload Users (CSV)</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Upload a CSV file with the following headers: <strong>name, email, rollNumber, password, role, dob</strong>.
                            Date of birth should be in YYYY-MM-DD format.
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadTemplate}
                            sx={{ mb: 3, borderRadius: 0 }}
                        >
                            Download CSV Template
                        </Button>
                        <Divider sx={{ mb: 3 }} />
                        <Typography variant="subtitle2" gutterBottom>Select CSV File</Typography>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleBulkUpload}
                            style={{ display: 'block', width: '100%' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenBulkDialog(false)} sx={{ borderRadius: 0 }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog
                open={openCreateDialog}
                onClose={() => setOpenCreateDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 0 } }}
            >
                <DialogTitle>Create New Account</DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Full Name"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                    InputProps={{ sx: { borderRadius: 0 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                    InputProps={{ sx: { borderRadius: 0 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="dob"
                                    name="dob"
                                    label="Date of Birth"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formik.values.dob}
                                    onChange={formik.handleChange}
                                    error={formik.touched.dob && Boolean(formik.errors.dob)}
                                    helperText={formik.touched.dob && formik.errors.dob}
                                    InputProps={{ sx: { borderRadius: 0 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        id="role"
                                        name="role"
                                        value={formik.values.role}
                                        label="Role"
                                        onChange={formik.handleChange}
                                        sx={{ borderRadius: 0 }}
                                    >
                                        <MenuItem value="student">Student</MenuItem>
                                        <MenuItem value="teacher">Teacher</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {formik.values.role === 'student' && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        id="rollNumber"
                                        name="rollNumber"
                                        label="Roll Number"
                                        value={formik.values.rollNumber}
                                        onChange={formik.handleChange}
                                        error={formik.touched.rollNumber && Boolean(formik.errors.rollNumber)}
                                        helperText={formik.touched.rollNumber && formik.errors.rollNumber}
                                        InputProps={{ sx: { borderRadius: 0 } }}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label="Password"
                                    type="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                    InputProps={{ sx: { borderRadius: 0 } }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenCreateDialog(false)} sx={{ borderRadius: 0 }}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isRegistering} sx={{ borderRadius: 0, boxShadow: 'none' }}>
                            {isRegistering ? 'Creating...' : 'Create Account'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(deleteConfirm)}
                onClose={() => setDeleteConfirm(null)}
                PaperProps={{ sx: { borderRadius: 0 } }}
            >
                <DialogTitle>Confirm Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user <strong>{deleteConfirm?.name}</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 0 }}>Cancel</Button>
                    <Button
                        onClick={() => handleDeleteUser(deleteConfirm._id)}
                        color="error"
                        variant="contained"
                        sx={{ borderRadius: 0, boxShadow: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Task Confirmation Dialog */}
            <Dialog
                open={Boolean(deleteTaskConfirm)}
                onClose={() => setDeleteTaskConfirm(null)}
                PaperProps={{ sx: { borderRadius: 0 } }}
            >
                <DialogTitle>Confirm Delete Task</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this task?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteTaskConfirm(null)} sx={{ borderRadius: 0 }}>Cancel</Button>
                    <Button
                        onClick={handleDeleteTask}
                        color="error"
                        variant="contained"
                        sx={{ borderRadius: 0, boxShadow: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* History/Unblock Dialog */}
            <Dialog
                open={openHistoryDialog}
                onClose={() => setOpenHistoryDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none'
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 3,
                    py: 2
                }}>
                    <Avatar
                        src={selectedStudent?.profilePic}
                        variant="square"
                        sx={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' }}
                    >
                        {selectedStudent?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            Student Profile & History
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            {selectedStudent?.name} | {selectedStudent?.rollNumber}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    <Stack spacing={3}>
                        <Box sx={{ p: 2, bgcolor: selectedStudent?.isBlocked ? 'error.light' : 'success.light', borderLeft: '4px solid', borderColor: selectedStudent?.isBlocked ? 'error.main' : 'success.main' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" fontWeight={700} color={selectedStudent?.isBlocked ? 'error.dark' : 'success.dark'}>
                                    Status: {selectedStudent?.isBlocked ? 'BLOCKED' : 'ACTIVE'} | Malpractice Count: {selectedStudent?.malpracticeCount}
                                </Typography>
                                {!selectedStudent?.isBlocked && (
                                    <Chip label="Clear Integrity Record" size="small" color="success" variant="outlined" sx={{ borderRadius: 0, fontWeight: 700 }} />
                                )}
                            </Stack>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card variant="outlined" sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Academic Profile</Typography>
                                    </Box>
                                    <Grid container sx={{ p: 2 }} spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                            <Typography variant="body2" fontWeight={600}>{selectedStudent?.email}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Roll Number</Typography>
                                            <Typography variant="body2" fontWeight={600}>{selectedStudent?.rollNumber}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Date of Birth</Typography>
                                            <Typography variant="body2" fontWeight={600}>{selectedStudent?.dob ? new Date(selectedStudent.dob).toLocaleDateString() : '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Member Since</Typography>
                                            <Typography variant="body2" fontWeight={600}>{selectedStudent?.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>

                        {isHistoryLoading ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">Loading malpractice history...</Typography>
                            </Box>
                        ) : historyData ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined" sx={{ borderRadius: 0, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Violation Summary</Typography>
                                        </Box>
                                        <Box sx={{ p: 2 }}>
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">No Face:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{historyData.summary?.noFaceCount || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Multiple Face:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{historyData.summary?.multipleFaceCount || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Cell Phone:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{historyData.summary?.cellPhoneCount || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Prohibited Obj:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{historyData.summary?.prohibitedObjectCount || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Leaning Back:</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{historyData.summary?.leaningBackCount || 0}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" fontWeight={700}>Total Events:</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="error.main">{historyData.summary?.events || 0}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Card variant="outlined" sx={{ borderRadius: 0, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Detailed Cheating Logs</Typography>
                                        </Box>
                                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {historyData.cheatingLogs?.length ? (
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Date</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }} align="right">Violations</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {historyData.cheatingLogs.map((l, i) => (
                                                            <TableRow key={i} hover>
                                                                <TableCell sx={{ fontSize: '0.75rem' }}>{l.examName || l.examId || 'Unknown'}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.75rem' }}>{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                                                                    {Number(l.noFaceCount || 0) + Number(l.multipleFaceCount || 0) + Number(l.cellPhoneCount || 0) + Number(l.leaningBackCount || 0)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">No logs found</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Card>
                                </Grid>
                            </Grid>
                        ) : null}

                        {selectedStudent?.isBlocked && !isViewOnly && (
                            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={resetCount} onChange={(e) => setResetCount(e.target.checked)} sx={{ borderRadius: 0 }} />}
                                    label={<Typography variant="body2" fontWeight={600}>Reset malpractice count to zero upon unblocking</Typography>}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setOpenHistoryDialog(false)}
                        variant="outlined"
                        sx={{ borderRadius: 0, px: 4, py: 1, textTransform: 'none', fontWeight: 700 }}
                    >
                        {isViewOnly ? 'Close' : 'Cancel'}
                    </Button>
                    {selectedStudent && !selectedStudent.isBlocked && isViewOnly && (
                        <Button
                            onClick={() => {
                                handleBlockUser(selectedStudent);
                                setOpenHistoryDialog(false);
                            }}
                            variant="contained"
                            color="warning"
                            sx={{ borderRadius: 0, px: 4, py: 1, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                        >
                            Block Account
                        </Button>
                    )}
                    {!isViewOnly && selectedStudent?.isBlocked && (
                        <Button
                            onClick={handleUnblockUser}
                            variant="contained"
                            color="success"
                            sx={{ borderRadius: 0, px: 4, py: 1, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                        >
                            Confirm Unblock
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </PageContainer >
    );
};

// Internal grid component for clarity
const UsersGrid = ({ users, tab, query, onAskDelete, onAskProfile, onAskBlock }) => {
    const filtered = useMemo(() => {
        let byRole = [];
        if (tab === 'students') {
            byRole = users.filter((u) => u.role === 'student');
        } else if (tab === 'teachers') {
            byRole = users.filter((u) => u.role === 'teacher');
        } else if (tab === 'blocked') {
            byRole = users.filter((u) => u.isBlocked);
        }

        if (!query) return byRole;
        const q = query.toLowerCase();
        return byRole.filter((u) =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.rollNumber || '').toLowerCase().includes(q)
        );
    }, [users, tab, query]);

    const columns = useMemo(() => [
        {
            field: 'profilePic',
            headerName: '',
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Avatar
                    src={params.value}
                    variant="square"
                    sx={{ width: 35, height: 35, bgcolor: 'primary.main' }}
                >
                    {params.row.name?.charAt(0)}
                </Avatar>
            ),
        },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 200, valueGetter: (p) => p.row.email || '-' },
        {
            field: 'dob',
            headerName: 'Age',
            width: 100,
            valueGetter: (p) => {
                if (!p.row.dob) return '-';
                const ageDiffMs = Date.now() - new Date(p.row.dob).getTime();
                const ageDate = new Date(ageDiffMs);
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        },
        { field: 'rollNumber', headerName: 'Roll Number', flex: 1, minWidth: 140, valueGetter: (p) => p.row.rollNumber || '-' },
        // Show malpractice count specifically for blocked tab
        ...(tab === 'blocked' ? [{
            field: 'malpracticeCount',
            headerName: 'Malpractice',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => <Chip label={params.value || 0} size="small" color="warning" sx={{ borderRadius: 0 }} />
        }] : []),
        {
            field: 'status', headerName: 'Status', width: 120,
            valueGetter: (p) => (p.row.isBlocked ? 'Blocked' : 'Active'),
            renderCell: (params) => (
                params.value === 'Blocked' ? <Chip label="Blocked" color="error" size="small" sx={{ borderRadius: 0 }} /> : <Chip label="Active" color="success" size="small" sx={{ borderRadius: 0 }} />
            ),
            sortable: false,
        },
        {
            field: 'accessControl', headerName: 'Access Control', width: 140, sortable: false, filterable: false,
            renderCell: (params) => (
                params.row.role === 'student' && (
                    params.row.isBlocked ? (
                        <Tooltip title="Unblock Student">
                            <IconButton
                                color="success"
                                onClick={() => onAskProfile(params.row, false)}
                                size="small"
                                sx={{ p: '4px' }}
                            >
                                <LockOpenIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Block Student Account">
                            <IconButton
                                color="warning"
                                onClick={() => onAskBlock(params.row)}
                                size="small"
                                sx={{ p: '4px' }}
                            >
                                <LockIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )
                )
            )
        },
        {
            field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    {params.row.role === 'student' && (
                        <Tooltip title="View Profile & History">
                            <IconButton
                                color="primary"
                                onClick={() => onAskProfile(params.row, true)}
                                size="small"
                                sx={{ p: '4px' }}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Delete User">
                        <IconButton
                            color="error"
                            onClick={() => onAskDelete(params.row)}
                            size="small"
                            sx={{ p: '4px' }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ], [onAskDelete, onAskProfile, onAskBlock]);

    const rows = useMemo(() => filtered.map((u) => ({ id: u._id, ...u })), [filtered]);

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
                density="standard"
                // Clean styling
                sx={{
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiDataGrid-columnHeaders': {
                        bgcolor: 'background.paper',
                        fontWeight: 700,
                        borderRadius: 0
                    },
                    '& .MuiDataGrid-row:hover': {
                        bgcolor: 'action.hover',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #f0f0f0'
                    }
                }}
            />
        </Box>
    );
};

const ActivityGrid = ({ logs, loading }) => {
    const columns = [
        { field: 'username', headerName: 'Student Name', flex: 1 },
        { field: 'rollNumber', headerName: 'Roll Number', width: 150 },
        { field: 'examId', headerName: 'Exam (Ref)', flex: 1 },
        {
            field: 'violations',
            headerName: 'Violations',
            width: 150,
            valueGetter: (p) => (Number(p.row.noFaceCount || 0) + Number(p.row.multipleFaceCount || 0) + Number(p.row.cellPhoneCount || 0) + Number(p.row.leaningBackCount || 0)),
            renderCell: (params) => <Chip label={params.value} color="error" size="small" sx={{ borderRadius: 0 }} />
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 180,
            valueFormatter: (params) => new Date(params.value).toLocaleString()
        }
    ];

    const rows = (logs || []).map((l, i) => ({ id: l._id || i, ...l }));

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{ borderRadius: 0 }}
            />
        </Box>
    );
};

const TasksGrid = ({ tasks, loading, onDelete, onAssign }) => {
    const columns = [
        { field: 'title', headerName: 'Task Title', flex: 1 },
        { field: 'assignedTo', headerName: 'Assigned To', flex: 1, valueGetter: (p) => p.row.assignedTo?.name || 'Unknown' },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'completed' ? 'success' : 'warning'}
                    size="small"
                    sx={{ borderRadius: 0 }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params) => (
                <IconButton color="error" onClick={() => onDelete(params.row._id)}>
                    <DeleteIcon />
                </IconButton>
            )
        }
    ];

    const rows = (tasks || []).map((t) => ({ id: t._id, ...t }));

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={onAssign} sx={{ borderRadius: 0 }}>Assign New Task</Button>
            </Box>
            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    sx={{ borderRadius: 0 }}
                />
            </Box>
        </Box>
    );
};

export default AdminPage;
