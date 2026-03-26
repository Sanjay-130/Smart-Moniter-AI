import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetExamResultsForTeacherQuery } from 'src/slices/resultsApiSlice';
import { IconArrowLeft, IconEye } from '@tabler/icons-react';

const TeacherExamResults = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetExamResultsForTeacherQuery(examId, {
    skip: !examId,
  });

  const [selectedResult, setSelectedResult] = useState(null);

  if (!examId) {
    return (
      <PageContainer title="Exam Results" description="No exam selected">
        <Typography>No exam ID provided.</Typography>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Results" description="Loading...">
        <Typography>Loading results...</Typography>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Error" description="Error loading results">
        <Typography color="error">Error loading results. Please try again.</Typography>
      </PageContainer>
    );
  }

  const { examName, duration, totalQuestions, results } = data || {};

  return (
    <PageContainer title={`Results: ${examName}`} description={`Results for ${examName}`}>
      <DashboardCard
        title={`Results: ${examName}`}
        action={
          <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      >
        <Box mb={3} display="flex" gap={2}>
          <Chip label={`${totalQuestions} Questions`} color="primary" />
          <Chip label={`${duration} Mins`} color="secondary" />
          <Chip label={`${results?.length || 0} Submissions`} color="info" />
        </Box>

        {results && results.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={result.student?.profilePic}>{result.student?.name?.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {result.student?.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {result.student?.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{result.student?.rollNumber || '-'}</TableCell>
                    <TableCell>
                      {result.score} / {result.maxScore}
                    </TableCell>
                    <TableCell>
                      {result.percentage ? result.percentage.toFixed(2) : 0}%
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={result.status}
                        color={result.status === 'Passed' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<IconEye size={16} />}
                        onClick={() => setSelectedResult(result)}
                      >
                        View Answers
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary" align="center" mt={4}>
            No students have submitted this exam yet.
          </Typography>
        )}
      </DashboardCard>

      {/* Answer Details Dialog */}
      <Dialog
        open={Boolean(selectedResult)}
        onClose={() => setSelectedResult(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission Details - {selectedResult?.student?.name}
        </DialogTitle>
        <DialogContent dividers>
          {selectedResult?.answers?.map((answer, index) => {
            const isCode = answer.questionId?.questionType === 'CODE';
            return (
              <Card key={answer._id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Q{index + 1}: {answer.questionId?.questionText}
                    </Typography>
                    <Chip
                      label={answer.isCorrect ? 'Correct' : 'Incorrect'}
                      color={answer.isCorrect ? 'success' : 'error'}
                      size="small"
                    />
                  </Stack>

                  {isCode ? (
                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        Language used: <strong>{answer.language || 'N/A'}</strong>
                      </Typography>
                      <Box p={2} bgcolor="grey.100" borderRadius={1} mb={2} sx={{ overflowX: 'auto' }}>
                        <pre style={{ margin: 0 }}>
                          <code>{answer.codeAnswer || 'No code submitted'}</code>
                        </pre>
                      </Box>
                      <Stack direction="row" spacing={2}>
                        <Chip label={`Passed Test Cases: ${answer.passedTestCases || 0} / ${answer.totalTestCases || 0}`} size="small" variant="outlined" />
                      </Stack>
                    </Box>
                  ) : (
                    <Box mt={2}>
                      {answer.questionId?.options?.map((opt) => {
                        const isSelected = String(answer.selectedOption) === String(opt._id);
                        const isActualCorrect = opt.isCorrect;

                        return (
                          <Box
                            key={opt._id}
                            p={1}
                            mb={1}
                            borderRadius={1}
                            sx={{
                              border: '1px solid',
                              borderColor: 'grey.300',
                              bgcolor: isSelected
                                ? isActualCorrect
                                  ? 'success.light'
                                  : 'error.light'
                                : isActualCorrect
                                ? 'success.light'
                                : 'transparent',
                            }}
                          >
                            <Typography variant="body2">
                              {opt.optionText}
                              {isSelected && ' (Student chose this)'}
                              {isActualCorrect && ' (Correct Option)'}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default TeacherExamResults;
