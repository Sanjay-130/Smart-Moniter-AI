import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { IconListCheck, IconMail, IconUser } from '@tabler/icons-react';

import ProfileImg from 'src/assets/images/profile/user-1.jpg';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { logout } from './../../../slices/authSlice';
import { useLogoutMutation } from './../../../slices/usersApiSlice';

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const { userInfo } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutApiCall] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      localStorage.removeItem('isAdmin');
      dispatch(logout());
      navigate('/auth/login');
    } catch (err) { }
  };
  return (
    <Box>
      <IconButton
        size="large"
        aria-label="profile"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={userInfo?.profilePic || ProfileImg}
          alt={userInfo?.name}
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '200px',
          },
        }}
      >
        <MenuItem component={Link} to="/user/profile">
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        <MenuItem component={Link} to="/user/account">
          <ListItemIcon>
            <IconMail width={20} />
          </ListItemIcon>
          <ListItemText>My Account</ListItemText>
        </MenuItem>
        <MenuItem component={Link} to="/profile" state={{ editMode: true }}>
          <ListItemIcon>
            <IconListCheck width={20} />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>
        {userInfo?.role === 'student' && (
          <MenuItem component={Link} to="/my-tasks">
            <ListItemIcon>
              <IconListCheck width={20} />
            </ListItemIcon>
            <ListItemText>My Tasks</ListItemText>
          </MenuItem>
        )}
        <Box mt={1} py={1} px={2}>
          <Button
            variant="contained"
            onClick={logoutHandler}
            fullWidth
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
              color: 'white',
              borderRadius: 0,
              '&:hover': {
                background: 'linear-gradient(45deg, #b71c1c 30%, #d32f2f 90%)',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
