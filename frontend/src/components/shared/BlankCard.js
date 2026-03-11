import { Card } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const BlankCard = ({ children, className }) => {
  return (
    <Card
      sx={{
        p: 0,
        position: 'relative',
        borderRadius: 3,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
      className={className}
      elevation={0}
      variant={undefined}
    >
      {children}
    </Card>
  );
};

BlankCard.propTypes = {
  children: PropTypes.node,
};

export default BlankCard;
