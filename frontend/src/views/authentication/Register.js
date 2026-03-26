import React, { useEffect, useState } from 'react';
import { Grid, Box, Card, Typography, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthRegister from './auth/AuthRegister';
import AuthBackground from './auth/AuthBackground';
import AuthFeatures from './auth/AuthFeatures';
import { useFormik } from 'formik';
import * as yup from 'yup';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRegisterMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import Loader from './Loader';

const userValidationSchema = yup.object({
  name: yup.string().min(2).max(25).required('Please enter your name'),
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  rollNumber: yup.string().when('role', {
    is: 'student',
    then: (schema) => schema.required('Roll number is required for students'),
    otherwise: (schema) => schema.notRequired(),
  }),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
  confirm_password: yup
    .string()
    .required('Confirm Password is required')
    .oneOf([yup.ref('password'), null], 'Password must match'),
  role: yup.string().oneOf(['student', 'teacher'], 'Invalid role').required('Role is required'),
  dob: yup.date()
    .required('Date of birth is required')
    .test('age-validation', 'Invalid age for selected role', function(value) {
        if (!value) return false;
        const ageDiff = Date.now() - new Date(value).getTime();
        const ageDate = new Date(Math.abs(ageDiff));
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        
        const role = this.parent.role;
        if (role === 'student' && age < 18) {
            return this.createError({ message: 'Student must be at least 18 years old' });
        }
        if (role === 'teacher' && age < 23) {
            return this.createError({ message: 'Teacher must be at least 23 years old' });
        }
        return true;
    }),
});
// initial values will be created inside component so we can read URL params

const Register = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roleParam = params.get('role') || 'student';

  const initialUserValues = {
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    confirm_password: '',
    dob: '',
    role: roleParam,
    profilePic: '',
  };

  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userValidationSchema,
    onSubmit: (values, action) => {
      handleSubmit(values);
    },
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [register, { isLoading }] = useRegisterMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  // submit handled via formik/onSubmit

  const handleSubmit = async (formValues) => {
    const { name, email, rollNumber, password, confirm_password, role, dob, profilePic } = formValues;
    if (password !== confirm_password) {
      toast.error('Passwords do not match');
    } else {
      try {
        const payload = { name, email, password, role, dob, profilePic };
        if (role === 'student') payload.rollNumber = rollNumber;
        const res = await register(payload).unwrap();
        dispatch(setCredentials({ ...res }));
        formik.resetForm();

        navigate('/auth/login');
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <PageContainer title="Register" description="this is Register page">
      <Box
        sx={{
          position: 'relative',
        }}
      >
        <AuthBackground />
        <AuthFeatures role="general" />
        <Grid container spacing={0} justifyContent="center" sx={{ height: '100vh', background: 'transparent' }}>
          <Grid
            item
            xs={12}
            sm={12}
            lg={6}
            xl={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card elevation={9} sx={{ p: 2, zIndex: 1, width: '100%', maxWidth: '500px' }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Logo />
              </Box>
              <AuthRegister
                formik={formik}
                onSubmit={handleSubmit}
                subtext={
                  <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
                    CONDUCT SECURE ONLINE EXAMS NOW
                  </Typography>
                }
                subtitle={
                  <Stack direction="row" justifyContent="center" spacing={1} mt={3}>
                    <Typography color="textSecondary" variant="h6" fontWeight="400">
                      Already have an Account?
                    </Typography>
                    <Typography
                      component={Link}
                      to="/auth/login"
                      fontWeight="500"
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                      }}
                    >
                      Sign In
                    </Typography>
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
export default Register;
