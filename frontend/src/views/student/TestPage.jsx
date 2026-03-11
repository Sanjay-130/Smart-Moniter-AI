import React, { useEffect, useRef, useState } from 'react';
// import Draggable from 'react-draggable'; // Removed
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Container, Alert, Stack, Button, Typography, Paper } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import CodeQuestion from './Components/CodeQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery, useSubmitExamMutation } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useGetStudentTasksQuery, useUpdateAssignmentMutation } from 'src/slices/assignmentApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const TestPage = () => {
  const { examId } = useParams();
  const [examDurationInSeconds, setexamDurationInSeconds] = useState(0);
  const [timer, setTimer] = useState(0);
  const { data: userExamdata } = useGetExamsQuery();

  useEffect(() => {
    if (userExamdata && userExamdata.length > 0) {
      const exam = userExamdata.find((exam) => exam._id === examId);
      if (exam) {
        setexamDurationInSeconds(exam.duration * 60);
      }
    }
  }, [userExamdata, examId]);

  // keep local timer in sync when exam duration is set
  useEffect(() => {
    if (examDurationInSeconds && examDurationInSeconds > 0) {
      setTimer(examDurationInSeconds);
    }
  }, [examDurationInSeconds]);

  const [questions, setQuestions] = useState([]);
  const { data, isLoading } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({}); // Track student's selected answers by questionId
  const answersRef = useRef({}); // Ref for synchronous access during submission
  const [currentQuestion, setCurrentQuestion] = useState(0); // Lifted for navigation highlighting
  const [answeredMap, setAnsweredMap] = useState({}); // index: 'attended' | 'correct' | 'partial' | 'error'
  const navigate = useNavigate();

  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [submitExam] = useSubmitExamMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();
  const { data: assignments } = useGetStudentTasksQuery();
  const { userInfo } = useSelector((state) => state.auth);

  // Sync ref with state
  useEffect(() => {
    answersRef.current = studentAnswers;
  }, [studentAnswers]);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    ProhibitedObjectCount: 0,
    examId: examId,
    username: '',
    email: '',
    screenshots: [],
  });

  const [isBlurred, setIsBlurred] = useState(false);

  // Fullscreen handling
  const pageRef = useRef(null);
  const dragRef = useRef(null); // Ref for Draggable to avoid findDOMNode warning/error
  const submittedRef = useRef(false);

  // ... (rest of code) ...


  const [events, setEvents] = useState([]); // {id, type, message, severity}
  const pushEvent = (evt) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, severity: 'info', message: '', ...(evt || {}) };
    setEvents((prev) => [...prev, item]);
    // auto remove after 4s
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (data) {
      setQuestions(data);
    }
  }, [data]);


  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  // Save student's selected answer for a question
  const saveStudentAnswer = (questionId, selectedOptionId) => {
    answersRef.current[questionId] = selectedOptionId; // Sync ref immediately
    setStudentAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptionId
    }));
  };

  const [isExamStarted, setIsExamStarted] = useState(false);

  // --- SESSION PERSISTENCE LOGIC ---
  const STORAGE_KEY = `exam_session_${examId}_${userInfo?._id}`;

  const saveProgress = () => {
    const sessionData = {
      studentAnswers,
      timer,
      currentQuestion,
      answeredMap,
      score,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  };

  // Load progress on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Optional: Expiry check (e.g., if saved more than 24h ago, discard)
        setStudentAnswers(parsed.studentAnswers || {});
        setTimer(parsed.timer || 0); // Restore timer
        setCurrentQuestion(parsed.currentQuestion || 0);
        setAnsweredMap(parsed.answeredMap || {});
        setScore(parsed.score || 0);
        // We don't auto-start. We wait for user to click "Resume".
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, [examId, userInfo?._id]);

  // Save on every answer change or significant event
  useEffect(() => {
    if (isExamStarted) {
      saveProgress();
    }
  }, [studentAnswers, answeredMap, currentQuestion, isExamStarted, timer]); // Timer dependency might be heavy, but throttle handled by React 
  // actually timer updates every sec, `saveProgress` is sync and fast (small JSON). It's okay. 
  // Ideally debounce this, but for now simple correct logic.

  // --- MODIFIED RELOAD/VISIBILITY HANDLING ---
  // Instead of auto-submit, we now SAVE and PAUSE (reset isExamStarted).
  useEffect(() => {
    const handlePause = () => {
      if (isExamStarted) {
        saveProgress();
        setIsExamStarted(false); // Show Resume overlay
        // Optional: exit fullscreen just to be sure state matches UI
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => { });
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden && isExamStarted) {
        handlePause();
        setIsBlurred(true);
        toast.warning("Exam paused due to tab switch/interruption.");
      }
    };

    const onPageHide = () => {
      if (isExamStarted) {
        saveProgress();
      }
    };

    // --- ULTRA AGGRESSIVE FOCUS CHECK ---
    const intervalId = setInterval(() => {
      if (isExamStarted) {
        if (!document.hasFocus() || document.hidden) {
          setIsBlurred(true);
        }
      }
    }, 50);

    const onWindowBlur = () => {
      if (isExamStarted) setIsBlurred(true);
    };

    const onWindowFocus = () => {
      // Small delay to ensure clean state
      setTimeout(() => {
        if (document.hasFocus() && !document.hidden) {
          setIsBlurred(false);
        }
      }, 100);
    };

    const onKeyDown = (e) => {
      if (!isExamStarted) return;

      // combinations for screenshotting & devtools
      const isPrtSc = e.key === 'PrintScreen' || e.keyCode === 44;
      const isCtrlP = e.ctrlKey && e.key === 'p';
      const isWinShiftS = (e.metaKey || e.key === 'Meta') && e.shiftKey && e.key.toLowerCase() === 's';
      const isCmdShiftS = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4');
      const isDevTools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'));

      if (isPrtSc || isCtrlP || isWinShiftS || isCmdShiftS || isDevTools) {
        setIsBlurred(true);
        toast.error("Security violation: Prohibited action detected.");
        if (isDevTools) e.preventDefault();

        // If focus wasn't lost (common with just PrtSc key), unblur after 3s
        // If focus IS lost (Win+Shift+S), onWindowFocus will handle it when they focus back.
        setTimeout(() => {
          if (document.hasFocus() && !document.hidden) {
            setIsBlurred(false);
          }
        }, 3000);
      }
    };

    const onContextMenu = (e) => {
      if (isExamStarted) {
        e.preventDefault();
        toast.warning("Right-click is disabled during the exam.");
      }
    };

    const onMouseLeave = () => {
      if (isExamStarted) {
        setIsBlurred(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyDown); // Also catch on keyup for robustness
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyDown);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [isExamStarted, studentAnswers, timer, currentQuestion]);

  // Clear storage on successful submission
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleTestSubmission = async () => {
    if (submittedRef.current) return;
    try {
      submittedRef.current = true;
      // ... (existing submission logic) ...

      const cheatingLogPayload = {
        ...cheatingLog,
        username: userInfo?.name || cheatingLog.username,
        email: userInfo?.email || cheatingLog.email,
      };

      await saveCheatingLogMutation(cheatingLogPayload).unwrap();

      const total = examDurationInSeconds && examDurationInSeconds > 0 ? examDurationInSeconds : 400;
      const timeTaken = Math.floor((total - (timer || 0)) / 60);

      const resultData = {
        examId: examId,
        answers: questions.map(q => {
          const ans = answersRef.current[q._id];
          if (q.questionType === 'CODE') {
            return {
              questionId: q._id,
              codeAnswer: ans?.code || '',
              language: ans?.language || '',
              passedTestCases: ans?.passedTestCases || 0,
              totalTestCases: ans?.totalTestCases || 0,
            };
          }
          return {
            questionId: q._id,
            selectedOption: ans || '',
          };
        }),
        timeTaken: timeTaken,
      };

      const responseData = await submitExam(resultData).unwrap();
      const resultPercentage = responseData?.result?.percentage ?? 0;

      if (assignments && assignments.length > 0) {
        const assignment = assignments.find((a) => a.examId === examId);
        if (assignment) {
          await updateAssignment({
            id: assignment._id,
            status: 'completed',
            completedAt: new Date().toISOString(),
            score: resultPercentage,
          }).unwrap();
        }
      }

      clearSession(); // <--- CLEAR STORAGE AFTER SUCCESS
      toast.success('Test completed successfully!');
      navigate('/my-results');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.message || 'Failed to submit test');
      submittedRef.current = false; // Allow retry if failed
    } finally {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen?.();
        }
      } catch { }
    }
  };

  // ... (existing saveStudentAnswer helper) ...

  // const [isExamStarted, setIsExamStarted] = useState(false); // Already defined above

  // Handle Fullscreen on Start
  const handleStartExam = async () => {
    const el = document.documentElement;
    try {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen;
      if (req) await req.call(el);
    } catch (e) {
      console.error("Fullscreen failed:", e);
    }
    setIsExamStarted(true);
  };

  // Listen for fullscreen exit -> PAUSE instead of SUBMIT
  useEffect(() => {
    const onFsChange = () => {
      const inFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement);
      if (!inFs && isExamStarted) {
        // User left fullscreen manually -> Pause session
        setIsExamStarted(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('msfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('msfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
    };
  }, [isExamStarted]);

  // Determine if we are "Resuming" based on existing answers
  const hasSavedProgress = Object.keys(studentAnswers).length > 0 || timer < (examDurationInSeconds || 0);

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      {/* Start/Resume Exam Overlay */}
      {!isExamStarted && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h3" gutterBottom color="primary">
                {hasSavedProgress ? 'Resume Exam' : 'Ready for Exam?'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                {hasSavedProgress
                  ? 'We saved your progress. Click below to re-enter full-screen and continue.'
                  : 'Clicking "Start Exam" will enter full-screen mode.'}
                <br />
                Please keep your face visible in the camera at all times.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartExam}
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
              >
                {hasSavedProgress ? 'Resume Session' : 'Start Exam'}
              </Button>
            </Paper>
          </Container>
        </Box>
      )}

      <Box
        ref={pageRef}
        sx={{
          // Hide content visibly if not started
          display: isExamStarted ? 'block' : 'none',
          py: { xs: 2, md: 4 },
          minHeight: '100vh',
          bgcolor: '#f5f7fa', // Neutral professional background
          filter: isBlurred ? 'blur(60px)' : 'none',
          pointerEvents: isBlurred ? 'none' : 'auto',
          position: 'relative'
        }}
      >
        {isBlurred && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(60px)',
              textAlign: 'center',
              color: '#d32f2f',
              userSelect: 'none'
            }}
          >
            <Typography variant="h4" fontWeight={800} gutterBottom>
              SCREEN RIGIDLY PROTECTED
            </Typography>
            <Typography variant="h6" fontWeight={500}>
              Focus lost or prohibited action detected.
            </Typography>
          </Box>
        )}
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12} md={8} lg={8.5}>
              <BlankCard sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <Box
                  width="100%"
                  minHeight="520px"
                  display="flex"
                  flexDirection="column"
                  alignItems="stretch"
                  justifyContent="center"
                  sx={{
                    p: { xs: 2, md: 4 },
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    position: 'relative',
                    borderTop: '4px solid #1A237E', // Deep Blue Theme
                  }}
                >
                  {isLoading ? (
                    <Box display="flex" alignItems="center" justifyContent="center" py={8}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    questions[currentQuestion]?.questionType === 'CODE' ? (
                      <CodeQuestion
                        questions={questions}
                        studentAnswers={studentAnswers} // Pass saved answers
                        saveUserTestScore={saveUserTestScore}
                        saveStudentAnswer={saveStudentAnswer}
                        submitTest={handleTestSubmission}
                        currentQuestion={currentQuestion}
                        setCurrentQuestion={setCurrentQuestion}
                        onAnswered={(idx, status) => setAnsweredMap((prev) => ({ ...prev, [idx]: status || 'attended' }))}
                        onSelectionChange={(qid, val) => saveStudentAnswer(qid, val)}
                      />
                    ) : (
                      <MultipleChoiceQuestion
                        questions={questions}
                        saveUserTestScore={saveUserTestScore}
                        saveStudentAnswer={saveStudentAnswer}
                        submitTest={handleTestSubmission}
                        currentQuestion={currentQuestion}
                        setCurrentQuestion={setCurrentQuestion}
                        onAnswered={(idx, status) => setAnsweredMap((prev) => ({ ...prev, [idx]: status || 'attended' }))}
                        onSelectionChange={(qid, optId) => setStudentAnswers((prev) => ({ ...prev, [qid]: optId }))}
                      />
                    )
                  )}
                </Box>
              </BlankCard>
            </Grid>
            <Grid item xs={12} md={4} lg={3.5}>
              <Grid container spacing={3} sx={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
                <Grid item xs={12}>
                  <BlankCard sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        overflow: 'hidden',
                        bgcolor: '#ffffff',
                        borderRadius: 2,
                        position: 'relative',
                        borderTop: '4px solid #1A237E', // Matching accent
                      }}
                    >
                      <NumberOfQuestions
                        questionLength={questions.length}
                        submitTest={handleTestSubmission}
                        examDurationInSeconds={examDurationInSeconds}
                        onTimerChange={setTimer}
                        currentQuestion={currentQuestion}
                        answeredMap={answeredMap}
                        onJump={(idx) => setCurrentQuestion(idx)}
                      />
                    </Box>
                  </BlankCard>
                </Grid>
                {/* Integrated Camera Monitoring in Sidebar */}
                <Grid item xs={12}>
                  <BlankCard sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <Box sx={{
                      p: 2,
                      bgcolor: '#ffffff',
                      borderRadius: 2,
                      borderTop: '4px solid #1A237E', // Deep Blue Theme
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1A237E', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Monitoring
                      </Typography>
                      <WebCam cheatingLog={cheatingLog} updateCheatingLog={setCheatingLog} onEvent={pushEvent} />
                    </Box>
                  </BlankCard>
                </Grid>
                {/* Integrated Alerts in Sidebar */}
                {events.length > 0 && (
                  <Grid item xs={12}>
                    <Stack spacing={2}>
                      {events.map((e) => (
                        <Alert
                          key={e.id}
                          severity={e.severity || 'info'}
                          variant="filled"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            bgcolor: e.severity === 'error' ? '#d32f2f' : '#0288d1',
                            '& .MuiAlert-icon': { color: 'white' }
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.9 }}>
                            {e.severity === 'error' ? 'Malpractice Detected' : 'Notice'}
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {e.message}
                          </Typography>
                        </Alert>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Container>


        {/* Professional Alert Messages - Right Side Below Camera */}
      </Box>
    </PageContainer>
  );
};

export default TestPage;
