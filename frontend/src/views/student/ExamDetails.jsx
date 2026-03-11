import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  List,
  ListItemText,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import { uniqueId } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetExamsQuery, useValidateExamAccessMutation } from 'src/slices/examApiSlice';
import { useSelector } from 'react-redux';
import ExamDetailsView from '../teacher/ExamDetailsView';

// removed unused copyright helper for compact file

const DescriptionAndInstructions = () => {
  const navigate = useNavigate();

  const { examId } = useParams();
  const { data: exams } = useGetExamsQuery();
  const exam = exams?.find((e) => e._id === examId);
  const [validateAccess, { isLoading: validating }] = useValidateExamAccessMutation();

  const [certify, setCertify] = useState(false);
  const testId = uniqueId();
  const [openPwd, setOpenPwd] = useState(false);
  const [code, setCode] = useState('');

  const handleCertifyChange = () => {
    setCertify(!certify);
  };

  const handleTest = () => {
    // If exam requires password, prompt first
    if (exam?.accessCode) {
      setOpenPwd(true);
      return;
    }
    navigate(`/exam/${examId}/${testId}`);
  };

  const submitCode = async () => {
    try {
      await validateAccess({ examId, code }).unwrap();
      setOpenPwd(false);
      navigate(`/exam/${examId}/${testId}`);
    } catch (err) {
      toast.error(err?.data?.message || err?.error || 'Invalid exam password');
    }
  };

  return (
    <Card sx={{
      borderRadius: 2,
      boxShadow: 2,
      border: '1px solid',
      borderColor: 'divider',
      maxWidth: 820,
      mx: 'auto',
      px: { xs: 2.5, md: 3.5 },
      py: { xs: 3, md: 4 },
    }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ width: 6, height: 20, bgcolor: 'primary.main', borderRadius: 1, mr: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Description
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Short MCQ-based assessment. Read the key rules below and start when ready.
        </Typography>

        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1.5 }}>
            <Box sx={{ width: 6, height: 20, bgcolor: 'secondary.main', borderRadius: 1, mr: 1 }} />
            <Typography variant="h6" fontWeight={700}>Test Instructions</Typography>
          </Box>
          <List sx={{ mt: 0 }}>
            <ol style={{ margin: 0, paddingLeft: '18px' }}>
              <li>
                <ListItemText>
                  <Typography variant="body2">Only MCQ questions.</Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body2">Duration and question count as shown on exam card.</Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body2">Do not switch tabs during the test.</Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body2">Runs in fullscreen; stay in the test window.</Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body2">Answers save on Back/Next; you can revise within time.</Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body2">Submit before time ends to record your score.</Typography>
                </ListItemText>
              </li>
            </ol>
          </List>
        </>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1.5 }}>
          <Box sx={{ width: 6, height: 20, bgcolor: 'success.main', borderRadius: 1, mr: 1 }} />
          <Typography variant="h6" fontWeight={700}>Confirmation</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" mb={2} display="block">
          The test is proctored. Misconduct may lead to suspension or cancellation.
        </Typography>
        <Stack direction="column" alignItems="center" spacing={2.5}>
          <FormControlLabel
            control={<Checkbox checked={certify} onChange={handleCertifyChange} color="primary" />}
            label="I certify that I have carefully read and agree to all of the instructions mentioned above"
          />
          <Button
            variant="contained"
            size="large"
            disabled={!certify}
            onClick={handleTest}
            sx={{
              background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
              color: 'white',
              px: 6,
              py: 1.2,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #0D47A1 0%, #002171 100%)',
                boxShadow: '0 6px 16px rgba(26, 35, 126, 0.3)',
                transform: 'translateY(-1px)'
              },
              '&.Mui-disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            Start Test
          </Button>
        </Stack>
        <Dialog open={openPwd} onClose={() => setOpenPwd(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Enter Exam Password</DialogTitle>
          <DialogContent>
            <TextField
              label="Password"
              type="password"
              fullWidth
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPwd(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
            <Button
              onClick={submitCode}
              variant="contained"
              disabled={validating || !code}
              sx={{
                background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                px: 4,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0D47A1 0%, #002171 100%)',
                },
                '&.Mui-disabled': {
                  background: '#e0e0e0',
                }
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// no external image; using gradient hero

export default function ExamDetails() {
  const { userInfo } = useSelector((state) => state.auth);

  // If user is a teacher, show the teacher view
  if (userInfo?.role === 'teacher') {
    return <ExamDetailsView />;
  }

  // Otherwise show the student test-taking view
  return (
    <Box component={Paper} elevation={6} square sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      backgroundImage: `radial-gradient(800px 400px at -10% -10%, rgba(255, 209, 102, 0.20), transparent),
                        radial-gradient(600px 300px at 110% 0%, rgba(255, 102, 153, 0.18), transparent),
                        linear-gradient(180deg, #fafafa 0%, #f3f5f9 100%)`,
      backgroundBlendMode: 'screen, normal',
    }}>
      <Box sx={{ width: '100%', maxWidth: 980, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
        <DescriptionAndInstructions />
      </Box>
    </Box>
  );
}
