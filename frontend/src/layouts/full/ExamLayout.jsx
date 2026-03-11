import React, { useState } from 'react';
import { styled, Container, Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';

const MainWrapper = styled('div')(() => ({
  // display: 'flex',
  // minHeight: '100vh',
  // width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  // display: 'flex',
  // flexGrow: 1,
  // paddingBottom: '60px',
  // flexDirection: 'column',
  // zIndex: 1,
  // backgroundColor: 'black',
}));

const ExamLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Check if current path is a test page (has 3 parts after /exam/:id/:testId)
  // path: /exam/123/456 -> parts: ["", "exam", "123", "456"] -> length 4
  const isTestPage = location.pathname.split('/').length >= 4;

  return (
    <Box>
      {/* ------------------------------------------- */}
      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper>
        {/* ------------------------------------------- */}
        {/* Header - Hidden on Test Page */}
        {/* ------------------------------------------- */}
        {!isTestPage && (
          <Header
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            toggleMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}
        {/* ------------------------------------------- */}
        {/* PageContent */}
        {/* ------------------------------------------- */}
        <Outlet />
      </PageWrapper>
    </Box>
  );
};

export default ExamLayout;
