import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Stack,
    LinearProgress,
    Paper,
    Stepper,
    Step,
    StepLabel,
    useTheme,
    Alert,
} from '@mui/material';
import {
    IconCamera,
    IconWifi,
    IconShieldCheck,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconRefresh,
} from '@tabler/icons-react';
import Webcam from 'react-webcam';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';

const SystemCheck = () => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const webcamRef = useRef(null);
    const [cameraStatus, setCameraStatus] = useState('pending'); // pending, success, error
    const [netStatus, setNetStatus] = useState('pending');
    const [networkSpeed, setNetworkSpeed] = useState(null);

    const steps = ['Camera Check', 'Network Check'];

    // --- Camera ---
    const handleUserMedia = () => setCameraStatus('success');
    const handleUserMediaError = () => setCameraStatus('error');

    // --- Network ---
    const checkNetwork = useCallback(async () => {
        setNetStatus('testing');
        const start = Date.now();
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
            const duration = Date.now() - start;
            setNetworkSpeed(duration);
            setNetStatus(duration < 1000 ? 'success' : 'warning');
        } catch (err) {
            setNetStatus('error');
        }
    }, []);

    useEffect(() => {
        if (activeStep === 1) checkNetwork();
    }, [activeStep, checkNetwork]);

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleReset = () => {
        setActiveStep(0);
        setCameraStatus('pending');
        setNetStatus('pending');
        setNetworkSpeed(null);
    };

    const getStatusIcon = (status) => {
        if (status === 'success') return <IconCircleCheckFilled color="#4caf50" size={24} />;
        if (status === 'error') return <IconCircleXFilled color="#f44336" size={24} />;
        if (status === 'warning') return <IconCircleCheckFilled color="#ff9800" size={24} />;
        return null;
    };

    return (
        <PageContainer title="AI Readiness Diagnostic" description="Hardware and network check">
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        color: 'white',
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconShieldCheck size={48} />
                        <Box>
                            <Typography variant="h3" fontWeight={700}>AI System Check</Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                Ensure your environment is optimized for a successful proctored exam.
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                <BlankCard>
                    <Box p={4}>
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Grid container spacing={4} justifyContent="center">
                            {/* Step 0: Camera Check */}
                            {activeStep === 0 && (
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', bgcolor: '#000', mb: 3 }}>
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            onUserMedia={handleUserMedia}
                                            onUserMediaError={handleUserMediaError}
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                        {cameraStatus === 'error' && (
                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.8)', color: 'error.main', p: 4, textAlign: 'center' }}>
                                                <Typography variant="h6">Camera Access Denied. Please enable permissions in your browser.</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <IconCamera size={24} color={cameraStatus === 'success' ? '#4caf50' : '#bdbdbd'} />
                                            <Typography variant="h6" fontWeight={600}>Camera Status</Typography>
                                        </Stack>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(cameraStatus)}
                                            <Typography variant="body1" fontWeight={700} color={cameraStatus === 'success' ? 'success.main' : 'text.secondary'}>
                                                {cameraStatus === 'success' ? 'READY' : cameraStatus === 'error' ? 'FAILED' : 'WAITING...'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={cameraStatus !== 'success'}
                                        onClick={handleNext}
                                        sx={{ mt: 4, borderRadius: 2 }}
                                    >
                                        Next: Network Check
                                    </Button>
                                </Grid>
                            )}

                            {/* Step 1: Network Check */}
                            {activeStep === 1 && (
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'rgba(26,35,126,0.02)', borderRadius: 4, mb: 4 }}>
                                        <IconWifi size={64} color={netStatus === 'success' ? '#4caf50' : netStatus === 'warning' ? '#ff9800' : '#bdbdbd'} />
                                        <Typography variant="h5" fontWeight={700} mt={2} mb={1}>Testing Connectivity</Typography>
                                        {netStatus === 'testing' ? (
                                            <LinearProgress sx={{ mt: 3, borderRadius: 5, height: 6 }} />
                                        ) : (
                                            <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                                                {netStatus === 'success'
                                                    ? `Connection is strong! (${networkSpeed}ms)`
                                                    : netStatus === 'warning'
                                                        ? `Connection is a bit slow. (${networkSpeed}ms)`
                                                        : 'Connection failed.'}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <IconWifi size={24} />
                                            <Typography variant="h6" fontWeight={600}>Network Status</Typography>
                                        </Stack>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(netStatus)}
                                            <Typography
                                                variant="body1"
                                                fontWeight={700}
                                                color={netStatus === 'success' ? 'success.main' : netStatus === 'warning' ? 'warning.main' : 'text.secondary'}
                                            >
                                                {netStatus === 'success' ? 'IDEAL' : netStatus === 'warning' ? 'FAIR' : netStatus === 'error' ? 'FAILED' : 'TESTING...'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {netStatus === 'warning' && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            Your internet speed is a bit slow. AI monitoring might be slightly delayed. Try moving closer to your router.
                                        </Alert>
                                    )}

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={handleNext}
                                        disabled={netStatus === 'testing' || netStatus === 'error'}
                                        sx={{ mt: 4, borderRadius: 2 }}
                                    >
                                        Finish Diagnostic
                                    </Button>
                                </Grid>
                            )}

                            {/* Step 2: Summary */}
                            {activeStep === 2 && (
                                <Grid item xs={12} md={8} textAlign="center">
                                    <Box sx={{ p: 4, bgcolor: 'rgba(76,175,80,0.05)', borderRadius: 4, border: '1px solid rgba(76,175,80,0.2)', mb: 4 }}>
                                        <IconCircleCheckFilled size={80} color="#4caf50" />
                                        <Typography variant="h3" fontWeight={700} mt={2} mb={1}>Ready for Launch!</Typography>
                                        <Typography variant="body1" color="textSecondary">
                                            All systems are green. Your camera and network are optimized for AI proctoring.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            size="large"
                                            startIcon={<IconRefresh />}
                                            onClick={handleReset}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Test Again
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={() => window.location.href = '/exam'}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Go to Exams
                                        </Button>
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </BlankCard>
            </Box>
        </PageContainer>
    );
};

export default SystemCheck;
