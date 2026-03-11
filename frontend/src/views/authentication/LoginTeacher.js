import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Box, Card, Stack, Typography, Button } from '@mui/material';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';

import PageContainer from 'src/components/container/PageContainer';
import AuthLogin from './auth/AuthLogin';
import AuthBackground from './auth/AuthBackground';
import AuthFeatures from './auth/AuthFeatures';

import { useFormik } from 'formik';
import * as yup from 'yup';

import { useDispatch, useSelector } from 'react-redux';

import { useLoginMutation } from './../../slices/usersApiSlice';

import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';
import Loader from './Loader';

const userValidationSchema = yup.object({
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password should be of minimum 6 characters').required('Password is required'),
});
const initialUserValues = {
  email: '',
  password: '',
};

const LoginTeacher = () => {
  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userValidationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  const handleSubmit = async ({ email, password }) => {
    try {
      const res = await login({ email, password }).unwrap();
      sessionStorage.setItem('app_session_active', 'true');
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Teacher Login" description="Teacher login page">
      <Box sx={{ position: 'relative' }}>
        <AuthBackground />
        <AuthFeatures role="teacher" />
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
                {/* Simple board icon illustration */}
                <Box component="svg" width={92} height={72} viewBox="0 0 128 96">
                  <rect x="12" y="18" width="104" height="56" rx="6" fill="#111827" />
                  <rect x="20" y="26" width="88" height="40" rx="4" fill="#334155" />
                  <rect x="58" y="76" width="12" height="8" fill="#9ca3af" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>Teacher Login</Typography>
              <Typography variant="subtitle2" color="text.secondary" textAlign="center" mb={2}>
                TEACHER ACCESS ONLY
              </Typography>
              <AuthLogin
                formik={formik}
                usernameFieldName="email"
                usernameLabel="Email"
                placeholder="Enter Your Email"
                subtext={
                  <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
                    CONDUCT SECURE ONLINE EXAMS NOW
                  </Typography>
                }
                subtitle={
                  <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
                    {isLoading && <Loader />}
                  </Stack>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default LoginTeacher;
