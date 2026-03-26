import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import { IconTrash, IconPlus, IconLock, IconLockOpen, IconListDetails, IconClipboardList } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetExamsQuery, useDeleteExamMutation, useGetCategoriesQuery, useDeleteCategoryMutation, useUpdateExamAccessCodeMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

const ManageExamsPage = () => {
  const navigate = useNavigate();
  const { data: exams, isLoading, isError, refetch } = useGetExamsQuery();
  const { data: categories = [], refetch: refetchCategories } = useGetCategoriesQuery();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();
  const [updateAccessCode, { isLoading: isUpdatingCode }] = useUpdateExamAccessCodeMutation();

  const [passOpen, setPassOpen] = React.useState(false);
  const [passValue, setPassValue] = React.useState('');
  const [selectedExam, setSelectedExam] = React.useState(null);

  const openPassDialog = (exam) => {
    setSelectedExam(exam);
    setPassValue('');
    setPassOpen(true);
  };
  const closePassDialog = () => {
    setPassOpen(false);
    setSelectedExam(null);
    setPassValue('');
  };
  const savePass = async () => {
    if (!selectedExam) return;
    try {
      await updateAccessCode({ id: selectedExam._id, accessCode: passValue }).unwrap();
      toast.success(passValue ? 'Password set for exam' : 'Password cleared');
      closePassDialog();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.error || 'Failed to update password');
    }
  };
  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();

  const handleDeleteExam = async (examId, examName) => {
    const willDelete = await swal({
      title: 'Are you sure?',
      text: `Do you want to delete "${examName}"? This action cannot be undone!`,
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true,
    });

    if (willDelete) {
      try {
        await deleteExam(examId).unwrap();
        toast.success('Exam deleted successfully');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete exam');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Manage Exams" description="Manage all exams">
        <DashboardCard title="Manage Exams">
          <Typography>Loading exams...</Typography>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Manage Exams" description="Manage all exams">
        <DashboardCard title="Manage Exams">
          <Typography color="error">Error loading exams. Please try again.</Typography>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Manage Exams" description="Manage all exams">
      <DashboardCard title="Manage Exams">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">All Exams ({exams?.length || 0})</Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => navigate('/create-exam')}
          >
            Create New Exam
          </Button>
        </Box>

        {/* Categories management */}
        <Box mb={3}>
          <Typography variant="subtitle1" mb={1}>Categories</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <Chip
                  key={cat._id}
                  label={cat.name}
                  variant="outlined"
                  sx={{
                    '& .MuiChip-deleteIcon': {
                      color: 'error.main',
                      '&:hover': { color: 'error.dark' },
                    },
                  }}
                  onDelete={async () => {
                    const willDelete = await swal({
                      title: 'Delete category?',
                      text: `Delete category "${cat.name}" and all its association?`,
                      icon: 'warning',
                      buttons: ['Cancel', 'Delete'],
                      dangerMode: true,
                    });
                    if (willDelete) {
                      try {
                        await deleteCategory(cat._id).unwrap();
                        toast.success('Category deleted');
                        refetchCategories();
                        refetch();
                      } catch (err) {
                        toast.error(err?.data?.message || 'Failed to delete category');
                      }
                    }
                  }}
                  deleteIcon={<IconTrash size={16} />}
                />
              ))
            ) : (
              <Typography color="textSecondary">No categories yet</Typography>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {exams && exams.length > 0 ? (
            exams.map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: 1,
                    borderColor: 'grey.500',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1, pr: 1 }}>
                        {exam.examName}
                      </Typography>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteExam(exam._id, exam.examName)}
                        disabled={isDeleting}
                        sx={{ mt: -1 }}
                      >
                        <IconTrash size={20} />
                      </IconButton>
                    </Box>

                    <Box mb={2}>
                      <Chip
                        label={`${exam.totalQuestions} Questions`}
                        size="small"
                        color="primary"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip
                        label={`${exam.duration} mins`}
                        size="small"
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                      {exam.category && exam.category.name ? (
                        <Chip label={exam.category.name} size="small" sx={{ ml: 1 }} />
                      ) : null}
                      <Chip
                        label={exam.accessCode ? 'Password Protected' : 'No Password'}
                        size="small"
                        icon={exam.accessCode ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                        sx={{ ml: 1, mt: 1 }}
                        color={exam.accessCode ? 'default' : 'warning'}
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" mb={0.5}>
                      <strong>Live Date:</strong> {formatDate(exam.liveDate)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Deadline:</strong> {formatDate(exam.deadDate)}
                    </Typography>

                    <Stack direction="row" spacing={1} mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={exam.accessCode ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                        onClick={() => openPassDialog(exam)}
                        fullWidth
                      >
                        {exam.accessCode ? 'Password' : 'Set PW'}
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<IconListDetails size={16} />}
                        onClick={() => navigate(`/exam-log?examId=${exam._id}&categoryId=${exam.category?._id || ''}`)}
                        fullWidth
                        sx={{
                          background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                          fontWeight: 600
                        }}
                      >
                        View Logs
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<IconClipboardList size={16} />}
                        onClick={() => navigate(`/exam-results?examId=${exam._id}`)}
                        fullWidth
                        sx={{
                          background: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)',
                          fontWeight: 600
                        }}
                      >
                        Results
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary" mb={2}>
                  No exams created yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => navigate('/create-exam')}
                >
                  Create Your First Exam
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </DashboardCard>
      {/* Password dialog */}
      <Dialog open={passOpen} onClose={closePassDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedExam?.accessCode ? 'Update Exam Password' : 'Set Exam Password'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Exam Password"
            type="text"
            fullWidth
            autoFocus
            value={passValue}
            onChange={(e) => setPassValue(e.target.value)}
            placeholder={selectedExam?.accessCode ? 'Enter new password (leave empty to clear)' : 'Enter password'}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePassDialog}>Cancel</Button>
          <Button onClick={savePass} variant="contained" disabled={isUpdatingCode}>
            {selectedExam?.accessCode && passValue === '' ? 'Clear Password' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ManageExamsPage;
