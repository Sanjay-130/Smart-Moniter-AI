import React, { useState } from 'react';
import {
  Grid,
  Box,
  Card,
  Typography,
  Avatar,
  Stack,
  Button,
  TextField,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useUpdateUserMutation, useGetProfileQuery } from '../../slices/usersApiSlice';
import { setCredentials } from '../../slices/authSlice';
import PageContainer from 'src/components/container/PageContainer';
import {
  IconUser,
  IconMail,
  IconLock,
  IconEdit,
  IconCheck,
  IconX,
  IconSchool,
  IconCalendar,
  IconChalkboard,
} from '@tabler/icons-react';

const ProfilePage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { data: profileData } = useGetProfileQuery();
  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const displayUser = profileData || userInfo || {};

  const formatDateSafe = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSubmit = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const updateData = {
        _id: userInfo._id,
        name: formData.name,
        email: formData.email,
        role: userInfo.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await updateProfile(updateData).unwrap();
      dispatch(setCredentials(res));
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userInfo?.name || '',
      email: userInfo?.email || '',
      password: '',
      confirmPassword: '',
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <PageContainer title="Teacher Profile" description="Manage your profile">
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" mb={3} fontWeight={600}>
          My Profile
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Avatar
                src={displayUser?.profilePic}
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  fontSize: '2.5rem',
                  bgcolor: 'secondary.main',
                  mb: 2,
                }}
              >
                {!displayUser?.profilePic && getInitials(displayUser?.name)}
              </Avatar>
              <Typography variant="h5" fontWeight={600} mb={1}>
                {displayUser?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={1}>
                {displayUser?.email}
              </Typography>
              <Paper
                sx={{
                  bgcolor: 'secondary.light',
                  color: 'secondary.main',
                  py: 0.5,
                  px: 2,
                  borderRadius: 2,
                  display: 'inline-block',
                  mt: 2,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Teacher
                </Typography>
              </Paper>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2} alignItems="flex-start">
                <Box display="flex" alignItems="center" gap={1}>
                  <IconCalendar size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Joined: {formatDateSafe(displayUser?.createdAt)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconChalkboard size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Role: Teacher
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconSchool size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Department: Computer Science
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          {/* Profile Information Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                  Profile Information
                </Typography>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<IconEdit size={18} />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="success"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      sx={{ bgcolor: 'success.light' }}
                    >
                      <IconCheck size={20} />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={handleCancel}
                      disabled={isLoading}
                      sx={{ bgcolor: 'error.light' }}
                    >
                      <IconX size={20} />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <IconUser size={20} color="#49BEFF" />
                    <Typography variant="body2" fontWeight={600} color="textSecondary">
                      Full Name
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" ml={4}>
                      {userInfo?.name}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <IconMail size={20} color="#49BEFF" />
                    <Typography variant="body2" fontWeight={600} color="textSecondary">
                      Email Address
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" ml={4}>
                      {userInfo?.email}
                    </Typography>
                  )}
                </Box>

                {isEditing && (
                  <>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <IconLock size={20} color="#49BEFF" />
                        <Typography variant="body2" fontWeight={600} color="textSecondary">
                          New Password (Optional)
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        placeholder="Leave blank to keep current password"
                      />
                    </Box>

                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <IconLock size={20} color="#49BEFF" />
                        <Typography variant="body2" fontWeight={600} color="textSecondary">
                          Confirm New Password
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        placeholder="Confirm your new password"
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ProfilePage;
