import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Chip,
    Button,
    Stack,
    CircularProgress,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetStudentTasksQuery } from 'src/slices/assignmentApiSlice';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    IconCalendarEvent,
    IconTrophy,
    IconListCheck,
    IconQuote,
    IconSun,
    IconMoon,
    IconClock,
    IconDeviceLaptop,
} from '@tabler/icons-react';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import _ from 'lodash';

// --- Sub-component: Countdown Timer ---
const CountdownTimer = ({ targetDate, onEnd }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

    useEffect(() => {
        const calculate = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
                if (onEnd) onEnd();
                return;
            }
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                total: difference
            });
        };
        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onEnd]);

    if (timeLeft.total <= 0) return null;

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <IconClock size={16} />
            <Typography variant="body2" fontWeight={700}>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {timeLeft.hours.toString().padStart(2, '0')}:
                {timeLeft.minutes.toString().padStart(2, '0')}:
                {timeLeft.seconds.toString().padStart(2, '0')}
            </Typography>
        </Stack>
    );
};

const TodayPage = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const { data: tasks, isLoading: isTasksLoading } = useGetStudentTasksQuery();
    const { data: allExams = [], isLoading: isExamsLoading } = useGetExamsQuery();

    const [holidayData, setHolidayData] = useState({ loading: true, event: null, error: null });
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // 1. Fetch Holidays
        const fetchHolidays = async () => {
            try {
                const apiKey = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;
                const calendarId = 'en.indian#holiday@group.v.calendar.google.com';
                const today = new Date();
                const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();

                const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;

                const res = await fetch(url);
                const data = await res.json();

                if (data.items && data.items.length > 0) {
                    setHolidayData({ loading: false, event: data.items[0], error: null });
                } else {
                    setHolidayData({ loading: false, event: null, error: null });
                }
            } catch (error) {
                console.error("Failed to fetch holidays", error);
                setHolidayData({ loading: false, event: null, error: "Could not fetch holiday data." });
            }
        };

        fetchHolidays();

        // Timer for live date update
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentDate.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const isBirthday = () => {
        if (!userInfo?.dob) return false;
        const dob = new Date(userInfo.dob);
        const today = new Date();
        return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    };

    const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];

    return (
        <PageContainer title="Today's Updates" description="Daily overview">
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

                {/* Header Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Decorative Circles */}
                    <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, left: 50, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3}>
                        <Box flex={1}>
                            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Typography>
                            <Typography variant="h2" fontWeight={700} sx={{ mb: 2 }}>
                                {getGreeting()}, {_.startCase(userInfo?.name?.split(' ')[0])}
                            </Typography>

                            {isBirthday() && (
                                <Chip
                                    label="🎂 Happy Birthday!"
                                    sx={{
                                        bgcolor: 'white',
                                        color: '#1a237e',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        height: 40,
                                        px: 1
                                    }}
                                />
                            )}
                        </Box>

                        {/* Holiday / Special Event Box */}
                        <Box sx={{ minWidth: 300 }}>
                            {holidayData.loading ? (
                                <CircularProgress sx={{ color: 'white' }} />
                            ) : holidayData.event ? (
                                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                                        <IconCalendarEvent size={32} color="#ffd700" />
                                        <Typography variant="h6" fontWeight={700} color="white">
                                            Special Event
                                        </Typography>
                                    </Stack>
                                    <Typography variant="h5" fontWeight={600} color="white" gutterBottom>
                                        {holidayData.event.summary}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {holidayData.event.description || "Public Holiday observed in India."}
                                    </Typography>
                                </Paper>
                            ) : (
                                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 3 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        {currentDate.getHours() < 18 ? <IconSun size={32} color="#ffd700" /> : <IconMoon size={32} color="#90caf9" />}
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} color="white">
                                                No Special Events
                                            </Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                Just a regular, productive day!
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            )}
                        </Box>
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h5" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1.5}>
                                <IconCalendarEvent size={28} />
                                Smart Exam Calendar
                            </Typography>

                            {isExamsLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                <Grid container spacing={2}>
                                    {allExams
                                        .filter(exam => {
                                            const live = new Date(exam.liveDate);
                                            const dead = new Date(exam.deadDate);
                                            const now = new Date();
                                            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                                            // Show if live within 7 days, or is currently live
                                            return (live >= now && live <= sevenDaysLater) || (now >= live && now <= dead);
                                        })
                                        .sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate))
                                        .map(exam => {
                                            const now = new Date();
                                            const isLive = now >= new Date(exam.liveDate) && now <= new Date(exam.deadDate);

                                            return (
                                                <Grid item xs={12} key={exam._id}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            p: 2.5,
                                                            borderRadius: 4,
                                                            border: '1px solid',
                                                            borderColor: isLive ? 'primary.main' : 'rgba(0,0,0,0.08)',
                                                            bgcolor: isLive ? 'rgba(93,135,255,0.04)' : 'white',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {isLive && (
                                                            <Box
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: 15,
                                                                    right: 15,
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: '50%',
                                                                    bgcolor: 'error.main',
                                                                    boxShadow: '0 0 0 rgba(244, 67, 54, 0.4)',
                                                                    animation: 'pulse 1.5s infinite'
                                                                }}
                                                            />
                                                        )}
                                                        <Grid container alignItems="center" spacing={2}>
                                                            <Grid item xs={12} sm={2} textAlign="center">
                                                                <Box sx={{ bgcolor: isLive ? 'primary.main' : 'rgba(0,0,0,0.04)', color: isLive ? 'white' : 'text.primary', p: 1, borderRadius: 2 }}>
                                                                    <Typography variant="h5" fontWeight={800}>
                                                                        {new Date(exam.liveDate).getDate()}
                                                                    </Typography>
                                                                    <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                                                        {new Date(exam.liveDate).toLocaleDateString('en-GB', { month: 'short' })}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Typography variant="h6" fontWeight={700}>{exam.examName}</Typography>
                                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <IconDeviceLaptop size={14} /> {exam.category?.name || 'Academic Exam'}
                                                                </Typography>
                                                                <Box sx={{ color: isLive ? 'primary.main' : 'text.secondary' }}>
                                                                    {isLive ? (
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <Chip label="LIVE NOW" color="error" size="small" sx={{ fontWeight: 800, height: 20 }} />
                                                                            <Typography variant="body2" fontWeight={600}>Ends in:</Typography>
                                                                            <CountdownTimer targetDate={exam.deadDate} />
                                                                        </Stack>
                                                                    ) : (
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <Typography variant="body2" fontWeight={600}>Starts in:</Typography>
                                                                            <CountdownTimer targetDate={exam.liveDate} />
                                                                        </Stack>
                                                                    )}
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={12} sm={4} textAlign="right">
                                                                <Button
                                                                    fullWidth
                                                                    variant={isLive ? "contained" : "outlined"}
                                                                    color={isLive ? "primary" : "inherit"}
                                                                    onClick={() => navigate(`/exam/${exam._id}`)}
                                                                    disabled={!isLive && (new Date(exam.liveDate) > new Date())}
                                                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                                                >
                                                                    {isLive ? "Join Exam" : "View Details"}
                                                                </Button>
                                                            </Grid>
                                                        </Grid>
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                </Grid>
                            )}
                        </Box>

                        <Typography variant="h5" fontWeight={700} mb={3}>
                            <IconListCheck style={{ verticalAlign: 'middle', marginRight: 10 }} />
                            Your Focus for Today
                        </Typography>

                        {isTasksLoading ? (
                            <CircularProgress />
                        ) : pendingTasks.length > 0 ? (
                            <Stack spacing={2}>
                                {pendingTasks.map((task) => (
                                    <Paper
                                        key={task._id}
                                        elevation={2}
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            borderLeft: '6px solid #5d87ff',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateX(4px)' }
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="h6" fontWeight={600}>{task.examName}</Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                                    Assigned by {task.assignedBy} • Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                onClick={() => navigate(`/exam/${task.examId}`)}
                                                sx={{ px: 4, borderRadius: 2 }}
                                            >
                                                Start
                                            </Button>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f5f7fa', border: '1px dashed #bdbdbd' }}>
                                <IconTrophy size={48} color="#9e9e9e" style={{ marginBottom: 16 }} />
                                <Typography variant="h6" color="textSecondary">You're all caught up!</Typography>
                                <Typography variant="body2" color="textSecondary">No pending tasks for today. Great job.</Typography>
                            </Paper>
                        )}
                    </Grid>

                    {/* Sidebar Info */}
                    <Grid item xs={12} md={4}>
                        {/* Daily Quote / Fact */}
                        <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                            <CardContent>
                                <Stack direction="row" spacing={1} mb={2}>
                                    <IconQuote size={24} color="#5d87ff" />
                                    <Typography variant="h6" fontWeight={600}>Daily Wisdom</Typography>
                                </Stack>
                                <Typography variant="body1" fontStyle="italic" color="textSecondary" sx={{ mb: 2 }}>
                                    "Success is not final, failure is not fatal: It is the courage to continue that counts."
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>— Winston Churchill</Typography>
                            </CardContent>
                        </Card>

                        {/* Quick Stats or Info */}
                        <Card elevation={3} sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} mb={2}>Overview</Typography>
                                <Stack spacing={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="textSecondary">Date</Typography>
                                        <Typography fontWeight={600}>{currentDate.toLocaleDateString()}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="textSecondary">Completed Tasks</Typography>
                                        <Typography fontWeight={600} color="success.main">
                                            {tasks?.filter(t => t.status === 'completed').length || 0}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="textSecondary">Pending</Typography>
                                        <Typography fontWeight={600} color="warning.main">
                                            {pendingTasks.length}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                <style>
                    {`
                    @keyframes pulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
                    }
                    `}
                </style>
            </Box>
        </PageContainer>
    );
};

export default TodayPage;
