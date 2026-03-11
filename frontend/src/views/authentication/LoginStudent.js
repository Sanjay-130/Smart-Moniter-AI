import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Box, Card, Stack, Typography, Dialog, DialogTitle, DialogContent, Button } from '@mui/material';
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
  rollNumber: yup.string().required('Roll number is required'),
  password: yup.string().min(6, 'Password should be of minimum 6 characters').required('Password is required'),
});
const initialUserValues = {
  rollNumber: '',
  password: '',
};

const LoginStudent = () => {
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedText, setBlockedText] = useState('');
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

  const handleSubmit = async ({ rollNumber, password }) => {
    try {
      const res = await login({ rollNumber, password }).unwrap();
      sessionStorage.setItem('app_session_active', 'true');
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      navigate('/');
    } catch (err) {
      const status = err?.status;
      const msg = err?.data?.message || err.error || 'Login failed';
      if (status === 403) {
        setBlockedText('You have been blocked due to malpractice. Please contact your teacher to get unblocked.');
        setBlockedOpen(true);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <PageContainer title="Student Login" description="Student login page">
      <Box sx={{ position: 'relative' }}>
        <AuthBackground />
        <AuthFeatures role="student" />
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
            <Card
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                zIndex: 1,
                width: '100%',
                maxWidth: '520px',
                borderRadius: 0,
                background: '#FFFFFF',
              }}
            >
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
                {/* Simple graduation cap illustration */}
                <Box component="svg" width={96} height={72} viewBox="0 0 128 96">
                  <path d="M64 8L8 32l56 24 56-24-56-24z" fill="#111827" />
                  <path d="M32 46v14c0 6 14 12 32 12s32-6 32-12V46L64 58 32 46z" fill="#334155" />
                  <circle cx="112" cy="44" r="5" fill="#f59e0b" />
                  <path d="M112 44v24" stroke="#f59e0b" strokeWidth="4" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>Student Login</Typography>
              <Typography variant="subtitle2" color="text.secondary" textAlign="center" mb={2}>
                STUDENT ACCESS ONLY
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mb={1}>
                Student access — use your Roll Number and password
              </Typography>
              <AuthLogin
                formik={formik}
                usernameFieldName="rollNumber"
                usernameLabel="Roll Number"
                placeholder="Enter Your Roll Number"
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
      <Dialog open={blockedOpen} onClose={() => setBlockedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Access Blocked
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" py={2}>
            <Typography variant="h6" gutterBottom>
              {blockedText}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Contact your teacher to be unblocked and retake future tests.
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setBlockedOpen(false)}>
              OK
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default LoginStudent;
