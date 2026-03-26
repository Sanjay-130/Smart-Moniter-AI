import React from 'react';
import { Box, Typography, Button, Select, MenuItem, Avatar, IconButton } from '@mui/material';
import { IconCamera, IconX } from '@tabler/icons-react';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { Stack } from '@mui/system';

const AuthRegister = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;
  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form">
        <Stack mb={3} alignItems="center" spacing={1}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={values.profilePic || ''}
              sx={{ width: 100, height: 100, border: '2px solid #5D87FF' }}
            >
              {!values.profilePic && values.name?.charAt(0)}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-pic-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    formik.setFieldValue('profilePic', reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label htmlFor="profile-pic-upload">
              <IconButton
                color="primary"
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
                size="small"
              >
                <IconCamera size={18} />
              </IconButton>
            </label>
            {values.profilePic && (
              <IconButton
                color="error"
                size="small"
                onClick={() => formik.setFieldValue('profilePic', '')}
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <IconX size={16} />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">
            Upload Profile Picture (Optional)
          </Typography>
        </Stack>

        <Stack mb={1}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="name"
            mb="5px"
          >
            Name
          </Typography>
          <CustomTextField
            id="name"
            name="name"
            placeholder="Enter Your Name "
            variant="outlined"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && errors.name ? true : false}
            helperText={touched.name && errors.name ? errors.name : null}
            // onChange={onNameChange} // Call the callback function on change
            fullWidth
            required
            //   size="small"
          />

          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="email"
            mb="5px"
            mt="10px"
          >
            Email Address
          </Typography>
          <CustomTextField
            id="email"
            name="email"
            variant="outlined"
            placeholder="Enter Your Email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email ? true : false}
            helperText={touched.email && errors.email ? errors.email : null}
            required
            fullWidth
            // onChange={onEmailChange} // Call the callback function on change
            //   size="small"
          />

          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="dob"
            mb="5px"
            mt="10px"
          >
            Date of Birth
          </Typography>
          <CustomTextField
            id="dob"
            name="dob"
            type="date"
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            value={values.dob}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.dob && errors.dob ? true : false}
            helperText={touched.dob && errors.dob ? errors.dob : null}
            required
            fullWidth
          />

          {values.role === 'student' ? (
            <>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                component="label"
                htmlFor="rollNumber"
                mb="5px"
                mt="10px"
              >
                Roll Number
              </Typography>
              <CustomTextField
                id="rollNumber"
                name="rollNumber"
                variant="outlined"
                placeholder="Enter Your Roll Number"
                value={values.rollNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.rollNumber && errors.rollNumber ? true : false}
                helperText={touched.rollNumber && errors.rollNumber ? errors.rollNumber : null}
                required
                fullWidth
              />
            </>
          ) : null}

          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="password"
            mb="5px"
            mt="10px"
          >
            Password
          </Typography>
          <CustomTextField
            id="password"
            name="password"
            type="password"
            variant="outlined"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password ? true : false}
            helperText={touched.password && errors.password ? errors.password : null}
            required
            fullWidth
            // onChange={onPasswordChange} // Call the callback function on change
            //   size="small"
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="confirm_password"
            mb="5px"
            mt="10px"
          >
            Confirm Password
          </Typography>
          <CustomTextField
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="false"
            variant="outlined"
            value={values.confirm_password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirm_password && errors.confirm_password ? true : false}
            helperText={
              touched.confirm_password && errors.confirm_password ? errors.confirm_password : null
            }
            fullWidth
            required
            // onChange={onConfirmPasswordChange} // Call the callback function on change
            //   size="small"
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="role"
            mb="5px"
            mt="10px"
          >
            Role
          </Typography>
          <Select
            id="role"
            name="role"
            required
            displayEmpty
            value={values.role}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.role && errors.role)}
            // value={userRole}
            // onChange={onRoleChange} // Call the callback function on change
            // inputProps={{ 'aria-label': 'Without label' }}
            //   size="small"
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
          </Select>
        </Stack>
        <Button
          // size="small"
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          // component={Link}
          // to="/auth/login"
          onClick={handleSubmit}
          // onClick={onSubmit} // Call the callback function on button click
        >
          Sign Up
        </Button>
      </Box>
      {subtitle}
    </>
  );
};
export default AuthRegister;
