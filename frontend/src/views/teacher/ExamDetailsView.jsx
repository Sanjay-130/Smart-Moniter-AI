import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  Stack,
  Button,
  Avatar,
  Tooltip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetQuestionsQuery, useGetExamsQuery } from 'src/slices/examApiSlice';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import {
  IconArrowLeft,
  IconEdit,
  IconClock,
  IconCalendarEvent,
  IconQuestionMark,
  IconClipboardCheck,
  IconCode,
  IconPointFilled,
} from '@tabler/icons-react';
import _ from 'lodash';

const ExamDetailsView = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const { data: exams, isLoading: examsLoading } = useGetExamsQuery();
  const { data: questions, isLoading: questionsLoading } = useGetQuestionsQuery(examId);

  const exam = exams?.find((e) => e._id === examId);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (examsLoading || questionsLoading) {
    return (
      <PageContainer title="Exam Details" description="View exam details">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" color="textSecondary">Loading exam details...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!exam) {
    return (
      <PageContainer title="Exam Details" description="View exam details">
        <Box textAlign="center" py={10}>
          <Typography variant="h3" color="error" gutterBottom>404</Typography>
          <Typography variant="h5" mb={4}>Exam not found in our records</Typography>
          <Button
            variant="contained"
            startIcon={<IconArrowLeft />}
            onClick={() => navigate('/manage-exams')}
          >
            Return to Manage Exams
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Exam Details" description="View exam details">
      <Box sx={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Navigation & Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Button
            variant="text"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/manage-exams')}
            sx={{ fontWeight: 600, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<IconEdit size={18} />}
            onClick={() => navigate(`/add-questions?examId=${examId}`)}
            sx={{
              borderRadius: 1,
              background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(13, 71, 161, 0.25)'
            }}
          >
            Edit Questions
          </Button>
        </Stack>

        {/* 1. Modern Header Panel */}
        <Paper
          elevation={0}
          sx={{
            p: 0,
            mb: 4,
            overflow: 'hidden',
            borderRadius: 0,
            border: '1px solid',
            borderColor: 'divider',
            background: '#fff'
          }}
        >
          <Box sx={{
            p: 4,
            background: 'linear-gradient(110deg, #1A237E 0%, #303F9F 60%, #3949AB 100%)',
            color: 'white',
            position: 'relative'
          }}>
            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <IconClipboardCheck size={200} />
            </Box>

            <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, letterSpacing: -0.5 }}>
              {exam.examName}
            </Typography>

            <Stack direction="row" spacing={3} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <IconQuestionMark size={18} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  {questions?.length || 0} Questions
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <IconClock size={18} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  {exam.duration} Minutes
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <IconPointFilled size={18} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  {questions?.reduce((sum, q) => sum + (q.marks ?? 1), 0) || 0} Total Marks
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Grid container sx={{ p: 3, bgcolor: '#f8f9fc' }}>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1.5} alignItems="center">
                <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: 1.5, display: 'flex', color: 'success.main' }}>
                  <IconCalendarEvent size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ textTransform: 'uppercase' }}>
                    Scheduled Live Date
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(exam.liveDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ mt: { xs: 2.5, md: 0 } }}>
              <Box display="flex" gap={1.5} alignItems="center">
                <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1.5, display: 'flex', color: 'error.main' }}>
                  <IconCalendarEvent size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ textTransform: 'uppercase' }}>
                    Strict Submission Deadline
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(exam.deadDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* 2. Questions List Section */}
        <Typography variant="h5" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1.5}>
          Assessment Content
          <Chip
            label="Verified"
            size="small"
            color="primary"
            sx={{ fontWeight: 800, height: 20, fontSize: '10px' }}
          />
        </Typography>

        {questions && questions.length > 0 ? (
          <Stack spacing={3}>
            {questions.map((q, index) => (
              <BlankCard key={q._id}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800
                      }}>
                        {index + 1}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="textPrimary">
                          Question {index + 1}
                        </Typography>
                        <Chip
                          icon={q.questionType === 'CODE' ? <IconCode size={14} /> : <IconPointFilled size={14} />}
                          label={q.questionType === 'CODE' ? 'Programming' : 'Multiple Choice'}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '11px', fontWeight: 600, mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight={800} color="primary">
                        {q.marks || 1}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="textSecondary">MARKS</Typography>
                    </Box>
                  </Stack>

                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 3, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {q.question}
                  </Typography>

                  {q.questionType === 'MCQ' && (
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="textSecondary" mb={2}>
                        OPTIONS & ANSWERS
                      </Typography>
                      <Grid container spacing={2}>
                        {q.options?.map((option, optIndex) => (
                          <Grid item xs={12} sm={6} key={optIndex}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                border: '1px solid',
                                borderColor: option.isCorrect ? 'success.main' : 'divider',
                                bgcolor: option.isCorrect ? 'rgba(46, 125, 50, 0.04)' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}
                            >
                              <Avatar sx={{
                                width: 24,
                                height: 24,
                                fontSize: '12px',
                                fontWeight: 800,
                                bgcolor: option.isCorrect ? 'success.main' : 'grey.300'
                              }}>
                                {String.fromCharCode(65 + optIndex)}
                              </Avatar>
                              <Typography
                                variant="body2"
                                fontWeight={option.isCorrect ? 700 : 500}
                                sx={{ flex: 1, color: option.isCorrect ? 'success.dark' : 'text.primary' }}
                              >
                                {option.optionText || option.text}
                              </Typography>
                              {option.isCorrect && (
                                <Tooltip title="Correct Answer">
                                  <IconClipboardCheck size={18} color="#2e7d32" />
                                </Tooltip>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {q.questionType === 'CODE' && (
                    <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconCode size={18} /> INPUT FORMAT
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #eee' }}>
                            {q.codeQuestion?.inputFormat || 'Not specified'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconCode size={18} /> OUTPUT FORMAT
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #eee' }}>
                            {q.codeQuestion?.outputFormat || 'Not specified'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconClipboardCheck size={18} /> CONSTRAINTS
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #eee', fontFamily: 'monospace' }}>
                            {q.codeQuestion?.constraints || 'No constraints provided'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </Box>
              </BlankCard>
            ))}
          </Stack>
        ) : (
          <Box textAlign="center" py={8} component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
            <IconQuestionMark size={48} stroke={1.5} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="textSecondary" mb={3}>
              No questions have been added to this exam yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconEdit size={18} />}
              onClick={() => navigate(`/add-questions?examId=${examId}`)}
              sx={{ fontWeight: 700 }}
            >
              Add Initial Questions
            </Button>
          </Box>
        )}
      </Box>
    </PageContainer>
  );
};

export default ExamDetailsView;
