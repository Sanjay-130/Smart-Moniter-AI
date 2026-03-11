import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Paper,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import {
  IconTrophy,
  IconClock,
  IconCalendar,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { useGetResults } from 'src/slices/resultsApiSlice';
import { toast } from 'react-toastify';

const ResultPage = () => {
  const { results: examResults, isLoading, error, refetch } = useGetResults();
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      toast.error(error);
    } else {
      setLocalError(null);
    }
  }, [error]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Results refreshed successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Error refreshing results');
    }
  };

  if (localError) {
    return (
      <PageContainer title="My Results" description="View your exam results">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 500 }}>
            {localError}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconRefresh size={20} />}
            onClick={() => {
              setLocalError(null);
              refetch();
            }}
          >
            Try Again
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const getStatusColor = (status) => {
    return status === 'Passed' ? 'success' : 'error';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate overall statistics
  const totalExams = examResults.length;
  const passedExams = examResults.filter((r) => r.status === 'Passed').length;
  const averageScore = totalExams > 0
    ? examResults.reduce((acc, curr) => acc + curr.percentage, 0) / totalExams
    : 0;

  if (isLoading) {
    return (
      <PageContainer title="My Results" description="View your exam results">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Results" description="View your exam results">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={600}>
            My Exam Results
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<IconRefresh size={20} />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <IconTrophy size={40} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {totalExams}
                    </Typography>
                    <Typography variant="body2">Total Exams</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <IconCheck size={40} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {passedExams}
                    </Typography>
                    <Typography variant="body2">Passed</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <IconTrophy size={40} />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {averageScore.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Average Score</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Results List */}
        <DashboardCard title="Exam History">
          {examResults.length > 0 ? (
            <Stack spacing={3}>
              {examResults.map((result) => (
                <Paper key={result.id} elevation={2} sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} mb={1}>
                            {result.examName}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={result.status}
                              color={getStatusColor(result.status)}
                              size="small"
                            />
                            <Chip
                              label={`${result.percentage}%`}
                              color={getGradeColor(result.percentage)}
                              size="small"
                            />
                          </Stack>
                        </Box>
                      </Box>

                      <Box mb={2}>
                        <Typography variant="body2" color="textSecondary" mb={1}>
                          Score Progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={result.percentage}
                          sx={{ height: 8, borderRadius: 1 }}
                          color={getGradeColor(result.percentage)}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconCheck size={18} color="green" />
                            <Typography variant="body2">
                              <strong>{result.correctAnswers}</strong> Correct
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconX size={18} color="red" />
                            <Typography variant="body2">
                              <strong>{result.wrongAnswers}</strong> Wrong
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconClock size={18} />
                            <Typography variant="body2">
                              <strong>{result.timeTaken}</strong> / {result.duration} mins
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconCalendar size={18} />
                            <Typography variant="body2">{formatDate(result.date)}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        bgcolor="background.default"
                        borderRadius={2}
                        p={2}
                      >
                        <Typography variant="h2" fontWeight={700} color="primary">
                          {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          out of {result.maxScore} marks
                        </Typography>
                        <Divider sx={{ width: '100%', my: 1 }} />
                        <Typography variant="h4" fontWeight={600}>
                          {result.percentage}% / 100
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box textAlign="center" py={4}>
              <IconAlertCircle size={48} color="#9e9e9e" />
              <Typography variant="h6" color="textSecondary" mt={2}>
                No exam results found
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Your exam results will appear here once you complete an exam.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconRefresh size={20} />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Check Again'}
              </Button>
            </Box>
          )}
        </DashboardCard>
      </Box>
    </PageContainer>
  );
};

export default ResultPage;
