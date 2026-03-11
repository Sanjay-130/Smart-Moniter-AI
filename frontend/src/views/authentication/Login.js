import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, TextField, Chip, Divider,
  Checkbox, FormControlLabel, CircularProgress, Dialog,
  DialogTitle, DialogContent, InputAdornment, IconButton,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CodeIcon from '@mui/icons-material/Code';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import PageContainer from 'src/components/container/PageContainer';
import AuthBackground from './auth/AuthBackground';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const features = [
  { icon: SecurityIcon, title: 'AI Proctoring', desc: 'Advanced face & object detection to maintain exam integrity.' },
  { icon: CodeIcon, title: 'Code Editor', desc: 'IDE-like experience with multi-language support.' },
  { icon: AutoGraphIcon, title: 'Live Analytics', desc: 'Real-time behavioral insights and performance dashboards.' },
  { icon: AssignmentTurnedInIcon, title: 'Auto-Grading', desc: 'Instant results for objective tests and coding challenges.' },
];

const PORTALS = {
  student: {
    label: 'Student Portal',
    icon: SchoolIcon,
    color: '#1A237E',
    gradient: 'linear-gradient(135deg, #1A237E 0%, #283593 60%, #0D47A1 100%)',
    accentGrad: 'linear-gradient(90deg, #1A237E, #5D87FF, #0D47A1)',
    field: 'rollNumber',
    fieldLabel: 'Roll Number',
    placeholder: 'e.g. CS2023001',
    schema: yup.object({ rollNumber: yup.string().required('Roll number is required'), password: yup.string().min(6).required('Password is required') }),
    initial: { rollNumber: '', password: '' },
  },
  teacher: {
    label: 'Faculty Portal',
    icon: PersonOutlineIcon,
    color: '#1B5E20',
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
    accentGrad: 'linear-gradient(90deg, #1B5E20, #4CAF50, #2E7D32)',
    field: 'email',
    fieldLabel: 'Email Address',
    placeholder: 'faculty@institution.ac.in',
    schema: yup.object({ email: yup.string().email('Enter a valid email').required('Email is required'), password: yup.string().min(6).required('Password is required') }),
    initial: { email: '', password: '' },
  },
  admin: {
    label: 'Admin Portal',
    icon: AdminPanelSettingsIcon,
    color: '#4A148C',
    gradient: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 60%, #7B1FA2 100%)',
    accentGrad: 'linear-gradient(90deg, #4A148C, #AB47BC, #7B1FA2)',
    field: 'email',
    fieldLabel: 'Admin Email',
    placeholder: 'admin@institution.ac.in',
    schema: yup.object({ email: yup.string().email('Enter a valid email').required('Email is required'), password: yup.string().min(6).required('Password is required') }),
    initial: { email: '', password: '' },
  },
};

// ─── PORTAL FORM ──────────────────────────────────────────────────────────────

const PortalForm = ({ portalKey, onBack }) => {
  const portal = PORTALS[portalKey];
  const Icon = portal.icon;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPass, setShowPass] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const formik = useFormik({
    initialValues: portal.initial,
    validationSchema: portal.schema,
    onSubmit: async (values) => {
      try {
        const res = await login(values).unwrap();
        sessionStorage.setItem('app_session_active', 'true');
        
        // Handle admin specifically if role matches or using admin portal
        if (res.role === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            dispatch(setCredentials({ ...res }));
            formik.resetForm();
            navigate('/admin');
            return;
        }

        dispatch(setCredentials({ ...res }));
        formik.resetForm();
        navigate('/');
      } catch (err) {
        if (err?.status === 403) { setBlockedOpen(true); }
        else { toast.error(err?.data?.message || err.error || 'Login failed'); }
      }
    },
  });

  return (
    <>
      {/* Gradient accent top bar */}
      <Box sx={{ height: 5, background: portal.accentGrad, flexShrink: 0 }} />

      <Box sx={{ p: { xs: 4, sm: 5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ alignSelf: 'flex-start', mb: 3, fontWeight: 700, textTransform: 'none', color: 'text.secondary', px: 0 }}
        >
          Back
        </Button>

        {/* Icon + Title */}
        <Box textAlign="center" mb={4}>
          <Box
            sx={{
              width: 60, height: 60, borderRadius: '50%',
              background: portal.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              boxShadow: `0 8px 24px ${portal.color}55`,
            }}
          >
            <Icon sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          <Typography variant="h4" fontWeight={900} color="primary.dark" sx={{ letterSpacing: '-0.5px' }}>
            {portal.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in to access your dashboard
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={0.75} color="text.primary">
                {portal.fieldLabel}
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                name={portal.field}
                placeholder={portal.placeholder}
                value={formik.values[portal.field]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched[portal.field] && Boolean(formik.errors[portal.field])}
                helperText={formik.touched[portal.field] && formik.errors[portal.field]}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">Password</Typography>
                {portalKey !== 'admin' && (
                  <Typography
                    component={Link}
                    to="/auth/forgot-password"
                    variant="caption"
                    sx={{ color: portal.color, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    Forgot Password?
                  </Typography>
                )}
              </Stack>
              <TextField
                variant="outlined"
                fullWidth
                name="password"
                type={showPass ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(!showPass)} edge="end">
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            <FormControlLabel
              control={<Checkbox defaultChecked size="small" sx={{ color: portal.color, '&.Mui-checked': { color: portal.color } }} />}
              label={<Typography variant="body2" color="text.secondary">Remember this device</Typography>}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{
                py: 1.75, fontWeight: 800, fontSize: '1rem',
                borderRadius: 2, textTransform: 'none',
                background: portal.gradient,
                boxShadow: `0 8px 24px ${portal.color}44`,
                '&:hover': { boxShadow: `0 12px 32px ${portal.color}66`, transform: 'translateY(-1px)' },
                transition: 'all 0.25s ease',
              }}
            >
              {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        {/* Security footer */}
        <Box mt="auto" pt={3} textAlign="center">
          <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: '0.5px', fontWeight: 700 }}>
            🔒 256-BIT ENCRYPTED SESSION
          </Typography>
        </Box>
      </Box>

      {/* Blocked dialog (student only) */}
      <Dialog open={blockedOpen} onClose={() => setBlockedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={700}>Account Blocked</DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <Typography variant="h6" gutterBottom>Account suspended due to malpractice.</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please contact your teacher to have your account reinstated.
            </Typography>
            <Button variant="contained" onClick={() => setBlockedOpen(false)}>OK</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── MAIN LOGIN PAGE ──────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [activePortal, setActivePortal] = useState(null); // null | 'student' | 'teacher' | 'admin'
  const [animating, setAnimating] = useState(false);

  useEffect(() => { if (userInfo) navigate('/'); }, [navigate, userInfo]);

  const openPortal = (key) => {
    setAnimating(true);
    setTimeout(() => { setActivePortal(key); setAnimating(false); }, 10);
  };

  const closePortal = () => {
    setAnimating(true);
    setTimeout(() => { setActivePortal(null); setAnimating(false); }, 10);
  };

  return (
    <PageContainer title="SmartMonitor – Login" description="Next-Gen AI Exam Proctoring">
      <AuthBackground />

      <Box sx={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 10, overflow: 'hidden' }}>

        {/* ── LEFT: Branding ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            width: { md: '55%', lg: '58%' },
            px: { md: 6, lg: 10 },
            py: 8,
            // Slide left when portal is active
            transform: activePortal ? 'translateX(-60px)' : 'translateX(0)',
            opacity: activePortal ? 0.6 : 1,
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease',
            pointerEvents: activePortal ? 'none' : 'auto',
          }}
        >
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'linear-gradient(135deg, #5D87FF, #1A237E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(93,135,255,0.4)' }}>
              <SecurityIcon sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: 'white', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
              SmartMonitor
            </Typography>
          </Stack>

          <Typography variant="h2" fontWeight={800} sx={{ color: 'white', lineHeight: 1.15, letterSpacing: '-1.5px', mb: 2 }}>
            Next-Generation<br />
            <Box component="span" sx={{ color: '#5D87FF' }}>AI Exam Proctoring</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 480, lineHeight: 1.8, mb: 6 }}>
            Secure, intelligent, and scalable. SmartMonitor ensures every exam is fair, monitored in real-time, and fully transparent.
          </Typography>

          {/* Feature grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <Box key={title} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', '&:hover': { background: 'rgba(93,135,255,0.1)', border: '1px solid rgba(93,135,255,0.3)', transform: 'translateY(-3px)' } }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'rgba(93,135,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                  <Icon sx={{ color: '#5D87FF', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={700} color="white" mb={0.5}>{title}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{desc}</Typography>
              </Box>
            ))}
          </Box>

          <Stack direction="row" spacing={2} mt={5}>
            {['256-BIT SSL', 'ISO 27001', 'GDPR Compliant'].map((b) => (
              <Chip key={b} label={b} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.5px' }} />
            ))}
          </Stack>
        </Box>

        {/* ── RIGHT: Login card area ── */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, sm: 6 }, position: 'relative' }}>

          {/* ── PORTAL SELECTOR (default view) ── */}
          <Box
            sx={{
              width: '100%', maxWidth: 460,
              position: 'absolute',
              transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease',
              transform: activePortal ? 'translateX(100px)' : 'translateX(0)',
              opacity: activePortal ? 0 : 1,
              pointerEvents: activePortal ? 'none' : 'auto',
            }}
          >
            <Box sx={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px) saturate(200%)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)' }}>
              <Box sx={{ height: 5, background: 'linear-gradient(90deg, #1A237E, #5D87FF, #0D47A1)' }} />
              <Box p={{ xs: 4, sm: 5 }}>
                <Box mb={4} textAlign="center">
                  <Chip label="SECURE PORTAL" size="small" sx={{ bgcolor: 'rgba(93,135,255,0.08)', color: 'primary.main', fontWeight: 800, letterSpacing: '1px', fontSize: '0.65rem', mb: 2, border: '1px solid rgba(93,135,255,0.2)' }} />
                  <Typography variant="h4" fontWeight={900} color="primary.dark" sx={{ letterSpacing: '-0.5px', mb: 1 }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Choose your portal to sign in</Typography>
                </Box>

                <Stack spacing={2}>
                  {/* Student */}
                  <Box
                    onClick={() => openPortal('student')}
                    sx={{
                      p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                      border: '2px solid rgba(26,35,126,0.12)',
                      background: 'linear-gradient(135deg, rgba(26,35,126,0.03), rgba(13,71,161,0.06))',
                      display: 'flex', alignItems: 'center', gap: 2,
                      transition: 'all 0.25s ease',
                      '&:hover': { borderColor: '#1A237E', background: 'rgba(26,35,126,0.07)', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(26,35,126,0.15)' },
                    }}
                  >
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, background: 'linear-gradient(135deg, #1A237E, #0D47A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SchoolIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={800} color="primary.dark">Student Portal</Typography>
                      <Typography variant="caption" color="text.secondary">Access exams using your Roll Number</Typography>
                    </Box>
                    <Typography color="primary" fontWeight={700} fontSize={20}>›</Typography>
                  </Box>

                  {/* Teacher */}
                  <Box
                    onClick={() => openPortal('teacher')}
                    sx={{
                      p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                      border: '2px solid rgba(27,94,32,0.12)',
                      background: 'linear-gradient(135deg, rgba(27,94,32,0.03), rgba(56,142,60,0.06))',
                      display: 'flex', alignItems: 'center', gap: 2,
                      transition: 'all 0.25s ease',
                      '&:hover': { borderColor: '#1B5E20', background: 'rgba(27,94,32,0.07)', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(27,94,32,0.15)' },
                    }}
                  >
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, background: 'linear-gradient(135deg, #1B5E20, #388E3C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PersonOutlineIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#1B5E20' }}>Faculty Portal</Typography>
                      <Typography variant="caption" color="text.secondary">Manage exams and monitor students</Typography>
                    </Box>
                    <Typography sx={{ color: '#1B5E20' }} fontWeight={700} fontSize={20}>›</Typography>
                  </Box>

                  <Divider sx={{ my: 0.5 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={600}>OR</Typography>
                  </Divider>

                  {/* Admin */}
                  <Box
                    onClick={() => openPortal('admin')}
                    sx={{
                      p: 2, borderRadius: 2.5, cursor: 'pointer',
                      border: '1px dashed rgba(74,20,140,0.25)',
                      display: 'flex', alignItems: 'center', gap: 2,
                      transition: 'all 0.25s ease',
                      '&:hover': { borderColor: '#4A148C', background: 'rgba(74,20,140,0.04)', transform: 'translateY(-1px)' },
                    }}
                  >
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#4A148C' }}>Admin Portal</Typography>
                      <Typography variant="caption" color="text.disabled">System administration access</Typography>
                    </Box>
                    <Typography sx={{ color: '#4A148C' }} fontWeight={700} fontSize={16}>›</Typography>
                  </Box>
                </Stack>

                <Box mt={3} textAlign="center">
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: '1px' }}>
                    🔒 ENCRYPTED SESSION • 256-BIT SECURITY
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── PORTAL FORM (slides in) ── */}
          {activePortal && (
            <Box
              sx={{
                width: '100%', maxWidth: 460,
                position: 'absolute',
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideInRight 0.45s cubic-bezier(0.34,1.2,0.64,1) forwards',
                '@keyframes slideInRight': {
                  from: { transform: 'translateX(80px)', opacity: 0 },
                  to: { transform: 'translateX(0)', opacity: 1 },
                },
              }}
            >
              <PortalForm portalKey={activePortal} onBack={closePortal} />
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Login;
