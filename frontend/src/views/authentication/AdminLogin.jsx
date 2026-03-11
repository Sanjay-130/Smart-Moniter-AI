import React, { useEffect } from 'react';
import { Grid, Box, Card, Typography, Button } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthLogin from './auth/AuthLogin';
import AuthBackground from './auth/AuthBackground';
import AuthFeatures from './auth/AuthFeatures';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';

const validationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
    if (isAdminFlag || userInfo?.role === 'admin') navigate('/admin');
  }, [navigate, userInfo]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async ({ email, password }) => {
      try {
        const response = await fetch('/api/users/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok) {
          if (data.role === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            toast.success('Admin login successful');
            navigate('/admin');
          } else {
            toast.error('Access denied. This account is not an administrator.');
          }
        } else {
          toast.error(data.message || 'Invalid admin credentials');
        }
      } catch (error) {
        toast.error('An error occurred during login. Please try again.');
        console.error('Login error:', error);
      }
    },
  });

  return (
    <PageContainer title="Admin Login" description="Admin login page">
      <Box sx={{ position: 'relative' }}>
        <AuthBackground />
        <AuthFeatures role="admin" />
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{
            height: '100vh',
            background: 'transparent',
            backgroundAttachment: 'fixed',
          }}
        >
          <Grid item xs={12} sm={12} lg={4} xl={3} display="flex" justifyContent="center" alignItems="center">
            <Card elevation={6} sx={{ p: { xs: 3, sm: 4 }, zIndex: 1, width: '100%', maxWidth: '520px', borderRadius: 0, background: '#FFFFFF' }}>
              <Box display="flex" justifyContent="flex-start" mb={1}>
                <Button
                  component={Link}
                  to="/auth/login"
                  variant="text"
                  color="primary"
                  size="small"
                  startIcon={<ArrowBackIosNewOutlinedIcon fontSize="small" />}
                  sx={{ fontWeight: 600, textTransform: 'none', px: 0 }}
                >
                  Back to Main
                </Button>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                {/* Simple shield/lock illustration */}
                <Box component="svg" width={86} height={72} viewBox="0 0 128 96">
                  <path d="M64 8l40 12v28c0 24-40 32-40 32S24 72 24 48V20l40-12z" fill="#111827" />
                  <path d="M64 40a10 10 0 0110 10v6H54v-6a10 10 0 0110-10z" fill="#f59e0b" />
                  <rect x="58" y="56" width="12" height="10" rx="2" fill="#fde68a" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>Admin Login</Typography>
              <AuthLogin
                formik={formik}
                usernameFieldName="email"
                usernameLabel="Email"
                placeholder="Enter Your Email"
                hideForgotPassword={true}
                subtext={
                  <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
                    ADMIN ACCESS ONLY
                  </Typography>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default AdminLogin;
