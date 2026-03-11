import React, { useMemo } from 'react';
import {
  IconArrowUpRight,
  IconChartBar,
  IconCheck,
  IconClipboardText,
  IconShieldCheck,
} from '@tabler/icons-react';
import { Box, Typography, Grid, CircularProgress, LinearProgress, Stack, Tooltip, Alert, AlertTitle, useTheme, Paper, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import { useSelector } from 'react-redux';
import BlankCard from 'src/components/shared/BlankCard';
import { useGetResults } from 'src/slices/resultsApiSlice';
import { useGetMyCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import { useGetStudentTasksQuery } from 'src/slices/assignmentApiSlice';
import { IconBulb, IconDeviceMobileOff, IconUserOff, IconLayoutDashboard } from '@tabler/icons-react';
import Chart from 'react-apexcharts';

const DashboardHome = () => {
  const theme = useTheme();
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { results = [], isLoading: resultsLoading } = useGetResults();
  const { data: cheatingLogs = [], isLoading: logsLoading } = useGetMyCheatingLogsQuery();

  // --- Integrity Coach Logic ---
  const coachTips = useMemo(() => {
    if (!cheatingLogs || cheatingLogs.length === 0) return [];

    const totals = cheatingLogs.reduce((acc, log) => ({
      noFace: acc.noFace + (log.noFaceCount || 0),
      cellPhone: acc.cellPhone + (log.cellPhoneCount || 0),
      prohibited: acc.prohibited + (log.prohibitedObjectCount || 0),
      leaning: acc.leaning + (log.leaningBackCount || 0),
    }), { noFace: 0, cellPhone: 0, prohibited: 0, leaning: 0 });

    const tips = [];
    if (totals.noFace > 5) tips.push({
      icon: <IconBulb size={20} />,
      text: "Improve your lighting or camera angle. Your face wasn't clearly visible in recent exams.",
      severity: 'warning'
    });
    if (totals.cellPhone > 0) tips.push({
      icon: <IconDeviceMobileOff size={20} />,
      text: "Ensure all mobile devices are completely powered off and out of reach before starting.",
      severity: 'error'
    });
    if (totals.leaning > 3) tips.push({
      icon: <IconUserOff size={20} />,
      text: "Try to maintain a steady, upright posture. Frequent leaning can trigger suspicious behavior flags.",
      severity: 'info'
    });
    if (totals.prohibited > 0) tips.push({
      icon: <IconClipboardText size={20} />,
      text: "Clear your workspace of all prohibited items like notebooks or unauthorized gadgets.",
      severity: 'warning'
    });

    return tips;
  }, [cheatingLogs]);

  const resultsList = Array.isArray(results)
    ? results
    : (results?.results || results?.data?.results || results?.data || []);

  const { data: assignments = [] } = useGetStudentTasksQuery();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  }, []);

  // Helper to normalize percentage
  const num = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const getPercent = (r) => {
    const p1 = r?.percentage ?? r?.percentageScore ?? r?.percent;
    const pn = num(p1);
    if (pn > 0) return Math.max(0, Math.min(100, Math.round(pn)));
    const score = num(r?.score ?? r?.marksObtained ?? r?.obtained ?? r?.correctAnswers ?? r?.correct ?? 0);
    const totalQ = num(r?.totalQuestions ?? r?.examTotalQuestions ?? r?.questions ?? r?.total ?? 0);
    const totalMarks = num(r?.totalMarks ?? r?.maxMarks ?? 0);
    const p2 = totalQ > 0 ? (score / totalQ) * 100 : (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
    return Math.max(0, Math.min(100, Math.round(p2)));
  };

  // KPI Calculations
  const sortedResults = useMemo(() =>
    [...resultsList].sort((a, b) =>
      new Date(a.submittedAt || a.updatedAt || a.createdAt || 0) -
      new Date(b.submittedAt || b.updatedAt || b.createdAt || 0)
    ), [resultsList]);

  const recent = useMemo(() =>
    [...resultsList]
      .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0))
      .slice(0, 8), [resultsList]);

  const recentPercents = useMemo(() => recent.map(getPercent).reverse(), [recent]);
  const recentLabels = useMemo(() => recent.map(r => r.examName || 'Exam').reverse(), [recent]);

  const passCount = useMemo(() => resultsList.filter((r) => {
    const p = getPercent(r);
    const status = (r?.status || r?.resultStatus || '').toString().toLowerCase();
    const isPassed = r?.isPassed === true || r?.passed === true || status === 'pass' || status === 'passed';
    return isPassed ? true : (status ? status === 'passed' : p >= 60);
  }).length, [resultsList]);

  const passRate = useMemo(() => resultsList.length > 0 ? Math.round((passCount / resultsList.length) * 100) : 0, [passCount, resultsList.length]);
  const totalTasks = Array.isArray(assignments) ? assignments.length : 0;
  const completedTasks = Array.isArray(assignments) ? assignments.filter((a) => a.status === 'completed').length : 0;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart Configurations - Ultra-Safe to prevent crash
  const trendChartConfig = useMemo(() => {
    const dataPoints = sortedResults.map(r => Number(getPercent(r)) || 0);
    const categories = sortedResults.map(r => String(r.examName || 'Exam'));

    return {
      series: [{
        name: 'Score %',
        data: dataPoints
      }],
      options: {
        chart: {
          type: 'area',
          height: 300,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: false }, // Disabled for stability
        },
        dataLabels: { enabled: false },
        stroke: {
          curve: 'straight', // Much safer than 'smooth' for single points
          width: 3,
          colors: ['#1A237E']
        },
        fill: {
          type: 'solid', // Simplified to solid initially for maximum stability
          opacity: 0.1,
          colors: ['#1A237E']
        },
        colors: ['#1A237E'],
        xaxis: {
          categories: categories,
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          max: 100,
          min: 0,
          labels: {
            style: { colors: '#707E94', fontWeight: 500 },
            formatter: (val) => `${Math.round(val || 0)}%`
          }
        },
        tooltip: {
          theme: 'dark',
          x: { show: true },
          y: {
            formatter: (val) => `${val}% Accuracy`
          }
        },
        grid: {
          borderColor: 'rgba(0,0,0,0.05)',
          strokeDashArray: 4,
          padding: { left: 0, right: 0 }
        }
      }
    };
  }, [sortedResults]);

  const recentChartConfig = useMemo(() => {
    const data = recentPercents.map(v => Number(v) || 0);
    const labels = recentLabels.map(l => String(l));

    return {
      series: [{
        name: 'Score',
        data: data
      }],
      options: {
        chart: {
          type: 'bar',
          height: 150,
          sparkline: { enabled: true },
          toolbar: { show: false },
          animations: { enabled: false }
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '50%',
            distributed: true,
          }
        },
        dataLabels: { enabled: false },
        colors: data.map(v => v >= 60 ? '#2e7d32' : '#d32f2f'),
        tooltip: {
          theme: 'dark',
          x: {
            show: true,
            formatter: (val, { dataPointIndex }) => labels[dataPointIndex] || 'Exam'
          },
          y: {
            formatter: (val) => `${val}%`
          }
        }
      }
    };
  }, [recentPercents, recentLabels]);

  return (
    <PageContainer title="Student Dashboard" description="Overview of your performance">
      <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Readiness Check CTA */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'rgba(26, 35, 126, 0.04)',
            border: '1px solid rgba(26, 35, 126, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconShieldCheck size={28} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>System Readiness Check</Typography>
              <Typography variant="body2" color="textSecondary">
                Ensure your Camera, Microphone and Internet are optimized for your next AI-proctored exam.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            onClick={() => navigate('/system-check')}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Run Diagnostic
          </Button>
        </Paper>
        <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
          {/* Integrity Coach (AI Guidance) Section */}
          {userInfo?.malpracticeCount > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 0,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: userInfo.malpracticeCount >= 2 ? 'error.light' : 'warning.light',
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  bgcolor: userInfo.malpracticeCount >= 2 ? 'error.main' : 'warning.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconShieldCheck size={28} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>Integrity Coach</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Personalized Guidance based on {cheatingLogs.length} Exam Session{cheatingLogs.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`${userInfo.malpracticeCount} Incident${userInfo.malpracticeCount > 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, border: '1px solid rgba(255,255,255,0.4)' }}
                />
              </Box>

              <Box p={3}>
                <Typography variant="body1" fontWeight={600} mb={2} color="text.primary">
                  {userInfo.malpracticeCount >= 2
                    ? "⚠️ CRITICAL: Your account is at risk of being blocked. Follow these steps to ensure integrity:"
                    : "To help you avoid future flags, our AI suggests the following adjustments:"}
                </Typography>

                <Stack spacing={2}>
                  {coachTips.length > 0 ? (
                    coachTips.map((tip, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: tip.severity === 'error' ? 'rgba(211, 47, 47, 0.04)' : tip.severity === 'warning' ? 'rgba(237, 108, 2, 0.04)' : 'rgba(2, 136, 209, 0.04)',
                          borderLeft: '4px solid',
                          borderColor: tip.severity === 'error' ? 'error.main' : tip.severity === 'warning' ? 'warning.main' : 'info.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Box sx={{ color: tip.severity === 'error' ? 'error.main' : tip.severity === 'warning' ? 'warning.main' : 'info.main' }}>
                          {tip.icon}
                        </Box>
                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                          {tip.text}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Analyzing telemetry... Keep up the good work and maintain a clear visibility!
                    </Typography>
                  )}
                </Stack>

                {userInfo.malpracticeCount >= 2 && (
                  <Alert severity="error" sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>
                    Final Warning: One more confirmed incident will result in an automatic account block.
                  </Alert>
                )}
              </Box>
            </Paper>
          )}

          {/* Welcome Header */}
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(26,35,126,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              {greeting}, {userInfo?.name ? userInfo.name.split(' ')[0] : 'User'}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
              Here's your academic performance overview for today.
            </Typography>
          </Box>

          {/* KPI Section */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <BlankCard>
                <Box p={3} display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle1" color="textSecondary" fontWeight={600} gutterBottom>
                      Total Pass Rate
                    </Typography>
                    <Typography variant="h3" fontWeight={800} color={passRate >= 60 ? 'success.main' : 'error.main'}>
                      {passRate}%
                    </Typography>
                  </Box>
                  <Box position="relative" display="inline-flex">
                    <CircularProgress
                      variant="determinate"
                      value={passRate}
                      size={80}
                      thickness={6}
                      color={passRate >= 60 ? 'success' : 'error'}
                      sx={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                    />
                    <Box
                      sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: 'absolute',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" fontWeight={700} color="textPrimary">
                        {passRate}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </BlankCard>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <BlankCard>
                <Box p={3}>
                  <Typography variant="subtitle1" color="textSecondary" fontWeight={600} gutterBottom>
                    Task Completion
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
                    <Typography variant="h3" fontWeight={800} color="primary.main">
                      {completedTasks}<Typography component="span" variant="h5" color="textSecondary" sx={{ ml: 0.5 }}>/ {totalTasks}</Typography>
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="textSecondary">
                      {taskPct}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={taskPct}
                    sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.05)' }}
                  />
                </Box>
              </BlankCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <BlankCard>
                <Box p={3}>
                  <Typography variant="subtitle1" color="textSecondary" fontWeight={600} gutterBottom>
                    Recent Performance
                  </Typography>
                  {recentPercents.length > 0 ? (
                    <Chart
                      options={recentChartConfig.options}
                      series={recentChartConfig.series}
                      type="bar"
                      height={100}
                    />
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height={100}>
                      <Typography variant="body2" color="textSecondary italic">No recent attempts</Typography>
                    </Box>
                  )}
                </Box>
              </BlankCard>
            </Grid>
          </Grid>

          {/* Deep Analysis Section */}
          <BlankCard>
            <Box p={4}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    Performance Analytics
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Detailed trend analysis of your exam results over time.
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(26,35,126,0.05)', px: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="primary">
                    {resultsList.length} TOTAL EXAMS
                  </Typography>
                </Box>
              </Stack>

              {resultsLoading ? (
                <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
              ) : resultsList.length > 0 ? (
                <Chart
                  options={trendChartConfig.options}
                  series={trendChartConfig.series}
                  type="area"
                  height={350}
                />
              ) : (
                <Box
                  display="flex" flexDirection="column" alignItems="center" justifyContent="center"
                  py={10} sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '2px dashed rgba(0,0,0,0.05)' }}
                >
                  <Typography variant="h6" color="textSecondary" gutterBottom>No Analytics Data Yet</Typography>
                  <Typography variant="body2" color="textSecondary">Take your first exam to see your performance progress here!</Typography>
                </Box>
              )}
            </Box>
          </BlankCard>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default DashboardHome;
