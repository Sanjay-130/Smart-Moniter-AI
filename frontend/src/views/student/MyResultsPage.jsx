import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import {
  IconTrophy,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { useGetResults } from 'src/slices/resultsApiSlice';
import { toast } from 'react-toastify';
// no navigation needed on student results list

const MyResultsPage = () => {
  const { results = [], isLoading, error, refetch } = useGetResults();
  const [localError, setLocalError] = useState(null);

  // Debug log to check the API response
  useEffect(() => {
    console.log('Results data:', results);
    if (results && results.length > 0) {
      console.log('First result item:', results[0]);
      console.log('Exam data:', results[0].exam);
    }
  }, [results]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed':
        return <IconCheck color="#4caf50" size={20} />;
      case 'failed':
        return <IconX color="#f44336" size={20} />;
      default:
        return <IconAlertCircle color="#ff9800" size={20} />;
    }
  };

  // Normalize inconsistent backend fields to ensure correct display
  const normalizedResults = Array.isArray(results)
    ? results
      .map((r) => {
        const examName = r.exam?.examName || r.examName || 'Unnamed Exam';
        const categoryName = r.exam?.category?.name || r.examCategoryName || r.category?.name || 'Uncategorized';
        const totalQuestions = Number(r.totalQuestions ?? r.examTotalQuestions ?? 0);
        const score = Number(r.score ?? 0);
        // Use maxScore (sum of all question marks) as the denominator for correct percentage
        const maxScore = Number(r.maxScore ?? 0) || totalQuestions;
        const percentage = typeof r.percentage === 'number' && !Number.isNaN(r.percentage)
          ? r.percentage
          : maxScore > 0
            ? (score / maxScore) * 100
            : 0;
        // Normalize percentage to out-of-100
        const displayPercentage = Math.min(100, Math.max(0, parseFloat(percentage.toFixed(1))));
        const status = r.status || (displayPercentage >= 50 ? 'Passed' : 'Failed');
        const date = r.submittedAt || r.updatedAt || r.createdAt || null;

        return {
          ...r,
          examName,
          examCategoryName: categoryName,
          totalQuestions,
          maxScore,
          score,
          percentage: displayPercentage,
          status,
          date,
        };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    : [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer title="My Results">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">My Exam Results</Typography>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={20} />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>

          {localError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {localError}
            </Alert>
          )}

          {normalizedResults.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <IconTrophy size={48} color="#9e9e9e" />
                  <Typography variant="h6" color="textSecondary" mt={2}>
                    No results found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Your exam results will appear here once they are available.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <TableContainer component={Card} variant="outlined" sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2 }}>
                <Table size="small" stickyHeader sx={{
                  '& thead th': {
                    backgroundColor: 'action.hover',
                    fontWeight: 600,
                    borderBottom: '1px solid',
                    borderColor: 'grey.300',
                  },
                  '& td, & th': {
                    borderBottom: '1px solid',
                    borderColor: 'grey.300',
                  },
                  // no vertical cell dividers for a cleaner look
                  '& tbody tr:hover': {
                    backgroundColor: 'rgba(90,106,133,0.04)'
                  },
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam</TableCell>
                      <TableCell align="center">Category</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {normalizedResults.length > 0 ? (
                      normalizedResults.map((result) => {
                        return (
                          <TableRow key={result._id} hover sx={{ '&:hover': { backgroundColor: 'rgba(90,106,133,0.04)' } }}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {result.examName}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Score: {Math.round(result.percentage) || 0}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="textSecondary">
                                {result.examCategoryName}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={getStatusIcon(result.status)}
                                label={result.status}
                                color={getStatusColor(result.status)}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" flexDirection="column" alignItems="center">
                                <Typography variant="body2" fontWeight={600}>
                                  {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)} / {result.maxScore} marks
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {result.percentage}% out of 100
                                </Typography>
                                <Box width={80} mt={0.5}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={result.percentage || 0}
                                    color={result.status === 'Passed' ? 'success' : 'error'}
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {result.date ? formatDate(result.date) : 'N/A'}
                              </Typography>
                            </TableCell>

                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Box>
                            <IconTrophy size={48} color="#9e9e9e" />
                            <Typography variant="h6" color="textSecondary" mt={2}>
                              No results found
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mt={1}>
                              Your exam results will appear here once they are available.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default MyResultsPage;
