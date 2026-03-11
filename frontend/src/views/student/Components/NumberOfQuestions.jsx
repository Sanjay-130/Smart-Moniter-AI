import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Box, Button, Stack, Typography } from '@mui/material';
const NumberOfQuestions = ({ questionLength, submitTest, examDurationInSeconds, onTimerChange, currentQuestion = 0, answeredMap = {}, onJump }) => {
  const totalQuestions = questionLength; //questions.length;
  // Generate an array of question numbers from 1 to totalQuestions
  const questionNumbers = Array.from({ length: totalQuestions }, (_, index) => index + 1);

  // Create an array of rows, each containing up to 4 question numbers
  const rows = [];
  for (let i = 0; i < questionNumbers.length; i += 5) {
    rows.push(questionNumbers.slice(i, i + 5));
  }

  // Timer related states - initialize from prop or fallback to 400 seconds
  const initialSeconds = typeof examDurationInSeconds === 'number' && examDurationInSeconds > 0 ? examDurationInSeconds : 400;
  const [timer, setTimer] = useState(initialSeconds);

  // Countdown timer
  useEffect(() => {
    // reset timer when examDurationInSeconds changes
    setTimer(initialSeconds);
    if (onTimerChange) onTimerChange(initialSeconds);

    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        const next = prevTimer - 1;
        if (onTimerChange) onTimerChange(next > 0 ? next : 0);
        if (next <= 0) {
          clearInterval(countdown);
          // ensure we call submitTest once when timer reaches zero
          try {
            submitTest();
          } catch (e) {
            // swallow submit errors to avoid crashing UI
            // caller will show error/toast as needed
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(countdown); // Cleanup the timer when the component unmounts
    };
  }, [initialSeconds]); // restart when initialSeconds changes

  return (
    <>
      <Box
        position="sticky"
        top="0"
        zIndex={1}
        bgcolor="white"
        sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'grey.200' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Questions: {totalQuestions}</Typography>
          <Typography variant="h6" color="primary.main">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </Typography>
          <Button
            variant="contained"
            onClick={submitTest}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)', // Keep red for finish/danger actions but consistent style
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
              }
            }}
          >
            Finish Test
          </Button>
        </Stack>
      </Box>

      <Box p={3} mt={3} maxHeight="270px">
        <Grid container spacing={1}>
          {rows.map((row, rowIndex) => (
            <Grid key={rowIndex} item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="start" flexWrap="wrap">
                {row.map((questionNumber) => {
                  const idx = questionNumber - 1;
                  const isCurrent = idx === currentQuestion;
                  const status = answeredMap[idx]; // 'correct', 'partial', 'error', 'attended' or undefined

                  let bg = '#fff'; // Default white (Unattended)
                  let color = '#5d87ff'; // Blue text for numbers
                  let border = '1px solid #e0e0e0';

                  if (isCurrent) {
                    bg = '#1A237E'; // Current active question (Deep Blue Theme)
                    color = '#fff';
                    border = 'none';
                  } else if (status === 'correct') {
                    bg = '#4caf50'; // Full Correct (Green)
                    color = '#fff';
                    border = 'none';
                  } else if (status === 'partial') {
                    bg = '#ffb74d'; // Partially Correct (Yellow/Orange)
                    color = '#fff';
                    border = 'none';
                  } else if (status === 'error') {
                    bg = '#ef5350'; // Error / Wrong (Red)
                    color = '#fff';
                    border = 'none';
                  } else if (status === 'attended') {
                    // Just attended but unknown status (fallback, maybe white or light gray)
                    bg = '#fff';
                  }

                  return (
                    <Box
                      key={questionNumber}
                      onClick={() => onJump && onJump(idx)}
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        m: 0.5,
                        bgcolor: bg,
                        color: color,
                        border: border,
                        borderRadius: 0, // Square box as requested
                        boxShadow: isCurrent ? 3 : 1,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isCurrent ? '#0D47A1' : '#f5f7fa',
                          transform: 'translateY(-2px)'
                        },
                      }}
                    >
                      {questionNumber}
                    </Box>
                  );
                })}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default NumberOfQuestions;
