import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Button,
  Typography,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';

// components
import Profile from './Profile';
import { IconBellRinging, IconMenu } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import TaskNotificationDialog from 'src/components/shared/TaskNotificationDialog';
import { useGetMyTasksQuery } from 'src/slices/tasksApiSlice';
import { useState } from 'react';

const Header = (props) => {
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  // const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { userInfo } = useSelector((state) => state.auth);

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.15)',
    background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
    justifyContent: 'center',
    backdropFilter: 'blur(6px)',
    borderBottom: 'none',
    color: 'white',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: 'white',
  }));

  const navigate = useNavigate();
  const [openTaskDialog, setOpenTaskDialog] = useState(false);

  // Poll for tasks if teacher
  const { data: tasks } = useGetMyTasksQuery(undefined, {
    pollingInterval: 30000,
    skip: userInfo?.role !== 'teacher'
  });

  const unreadCount = tasks?.filter(t => !t.isRead || t.status === 'pending').length || 0;

  const handleNotificationClick = () => {
    if (userInfo?.role === 'teacher') {
      setOpenTaskDialog(true);
    } else {
      navigate('/today');
    }
  };

  return (
    <>
      <AppBarStyled position="sticky" color="default">
        <ToolbarStyled>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={props.toggleMobileSidebar}
            sx={{
              display: {
                lg: 'none',
                xs: 'inline',
              },
            }}
          >
            <IconMenu width="20" height="20" />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, ml: 1, color: 'white', letterSpacing: 0.2 }}>
            SmartMonitor
          </Typography>

          <IconButton
            size="large"
            aria-label="notifications"
            color="inherit"
            onClick={handleNotificationClick}
          >
            <Badge variant={unreadCount > 0 ? "dot" : "standard"} badgeContent={unreadCount > 0 ? "" : 0} color="error" invisible={unreadCount === 0}>
              <IconBellRinging size="21" stroke="1.5" />
            </Badge>
          </IconButton>

          <Box flexGrow={1} />
          <Stack spacing={1} direction="row" alignItems="center">
            <Chip label={_.startCase(userInfo?.role || 'user')} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }} size="small" />
            <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
              Hello, {_.startCase(userInfo?.name || 'Guest')}
            </Typography>
            <Profile />
          </Stack>
        </ToolbarStyled>
      </AppBarStyled >
      {
        openTaskDialog && (
          <TaskNotificationDialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} />
        )
      }
    </>
  );
};


Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
