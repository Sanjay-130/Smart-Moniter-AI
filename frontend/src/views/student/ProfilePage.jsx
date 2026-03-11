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
  Alert,
  AlertTitle,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useUpdateUserMutation } from '../../slices/usersApiSlice';
import { setCredentials } from '../../slices/authSlice';
import PageContainer from 'src/components/container/PageContainer';
import {
  IconUser,
  IconMail,
  IconLock,
  IconEdit,
  IconCheck,
  IconX,
  IconBook,
  IconCalendar,
} from '@tabler/icons-react';

import { useLocation } from 'react-router-dom';

const ProfilePage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(location.state?.editMode || false);
  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    dob: userInfo?.dob ? new Date(userInfo.dob).toISOString().split('T')[0] : '',
    profilePic: userInfo?.profilePic || '',
    password: '',
    confirmPassword: '',
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePic = () => {
    setFormData({ ...formData, profilePic: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        dob: formData.dob,
        profilePic: formData.profilePic,
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
      dob: userInfo?.dob ? new Date(userInfo.dob).toISOString().split('T')[0] : '',
      profilePic: userInfo?.profilePic || '',
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
    <PageContainer title="Student Profile" description="Manage your profile">
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" mb={2} fontWeight={600}>
          My Profile
        </Typography>

        {userInfo?.malpracticeCount > 0 && (
          <Alert
            severity={userInfo.malpracticeCount >= 2 ? "error" : "warning"}
            sx={{ mb: 3, borderRadius: 0 }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>
              {userInfo.malpracticeCount >= 2 ? "Critical Malpractice Warning" : "Malpractice Warning"}
            </AlertTitle>
            You have recorded <strong>{userInfo.malpracticeCount}</strong> malpractice incident{userInfo.malpracticeCount > 1 ? 's' : ''}.
            {userInfo.malpracticeCount >= 2 ? (
              <> <strong>One more incident will result in an automatic account block.</strong> Please maintain exam integrity.</>
            ) : (
              <> Please be careful. Repeated incidents will lead to an automatic account block.</>
            )}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
                <Avatar
                  src={isEditing ? formData.profilePic : userInfo?.profilePic}
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '2.5rem',
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {!(isEditing ? formData.profilePic : userInfo?.profilePic) && getInitials(userInfo?.name)}
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-pic-file"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="profile-pic-file">
                      <IconButton
                        color="primary"
                        aria-label="upload picture"
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 15,
                          right: -5,
                          bgcolor: 'white',
                          '&:hover': { bgcolor: '#f5f5f5' },
                          boxShadow: 2,
                        }}
                        size="small"
                      >
                        <IconEdit size={16} />
                      </IconButton>
                    </label>
                    {formData.profilePic && (
                      <IconButton
                        color="error"
                        aria-label="remove picture"
                        onClick={handleRemoveProfilePic}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: -5,
                          bgcolor: 'white',
                          '&:hover': { bgcolor: '#f5f5f5' },
                          boxShadow: 2,
                        }}
                        size="small"
                      >
                        <IconX size={16} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
              {isEditing && (
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: -1, mb: 2 }}>
                  Max size: 2MB (JPG/PNG)
                </Typography>
              )}
              <Typography variant="h5" fontWeight={600} mb={1}>
                {userInfo?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={1}>
                {userInfo?.email}
              </Typography>
              <Paper
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  py: 0.5,
                  px: 2,
                  borderRadius: 0,
                  display: 'inline-block',
                  mt: 2,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Student
                </Typography>
              </Paper>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2} alignItems="flex-start">
                <Box display="flex" alignItems="center" gap={1}>
                  <IconCalendar size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Joined: {new Date(userInfo?.createdAt).toLocaleDateString() || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconBook size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Role: Student
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
                    <IconUser size={20} color="#5D87FF" />
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
                    <IconMail size={20} color="#5D87FF" />
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

                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <IconCalendar size={20} color="#5D87FF" />
                    <Typography variant="body2" fontWeight={600} color="textSecondary">
                      Date of Birth
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body1" ml={4}>
                      {userInfo?.dob ? new Date(userInfo.dob).toLocaleDateString() : 'Not Set'}
                      {userInfo?.dob && (
                        <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          ({Math.abs(new Date(Date.now() - new Date(userInfo.dob).getTime()).getUTCFullYear() - 1970)} years old)
                        </Typography>
                      )}
                    </Typography>
                  )}
                </Box>

                {isEditing && (
                  <>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <IconLock size={20} color="#5D87FF" />
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
                        <IconLock size={20} color="#5D87FF" />
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
