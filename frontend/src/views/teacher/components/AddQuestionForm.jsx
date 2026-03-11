import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Select,
  MenuItem,
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import swal from 'sweetalert';
import { useCreateQuestionMutation, useGetExamsQuery } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import {
  IconPlus,
  IconTrash,
  IconSettings,
  IconCode,
  IconCheck,
  IconListDetails,
  IconDotsVertical,
  IconQuestionMark,
} from '@tabler/icons-react';

const AddQuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [questionType, setQuestionType] = useState('MCQ');
  const [newQuestion, setNewQuestion] = useState('');
  const [marks, setMarks] = useState(1);

  // MCQ State
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);

  // CODE State
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', output: '', isHidden: false }]);

  const [selectedExamId, setSelectedExamId] = useState('');

  const [createQuestion, { isLoading }] = useCreateQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      setSelectedExamId(examsData[0]._id);
    }
  }, [examsData]);

  const selectedExam = examsData?.find((e) => e._id === selectedExamId);

  // Helper for MCQ
  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  // Helpers for CODE
  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '', isHidden: false }]);
  };

  const removeTestCase = (index) => {
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      swal('', 'Please enter the question text.', 'error');
      return;
    }

    let payload = {
      question: newQuestion,
      examId: selectedExamId,
      questionType,
      marks: parseInt(marks) || 1,
    };

    if (questionType === 'MCQ') {
      if (newOptions.some((opt) => !opt.trim())) {
        swal('', 'Please fill all options.', 'error');
        return;
      }
      payload.options = newOptions.map((opt, i) => ({
        optionText: opt,
        isCorrect: correctOptions[i],
      }));
    } else {
      if (!inputFormat || !outputFormat || testCases.some(tc => !tc.input || !tc.output)) {
        swal('', 'Please fill all code fields and test cases.', 'error');
        return;
      }
      payload.codeQuestion = {
        inputFormat,
        outputFormat,
        constraints,
        testCases,
        allowedLanguages: ['java', 'python', 'javascript'],
      };
      payload.options = [];
    }

    try {
      const res = await createQuestion(payload).unwrap();
      if (res) {
        toast.success('Question added successfully!!!');
        setQuestions([...questions, res]);
        setNewQuestion('');
        setMarks(1);
        if (questionType === 'MCQ') {
          setNewOptions(['', '', '', '']);
          setCorrectOptions([false, false, false, false]);
        } else {
          setInputFormat('');
          setOutputFormat('');
          setConstraints('');
          setTestCases([{ input: '', output: '', isHidden: false }]);
        }
      }
    } catch (err) {
      console.error(err);
      swal('', 'Failed to create question. ' + (err?.data?.message || err.message), 'error');
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box display="flex" alignItems="center" gap={1.5} mb={2.5} mt={1}>
      <Box sx={{
        bgcolor: 'primary.light',
        p: 1,
        borderRadius: 1,
        display: 'flex',
        color: 'primary.main'
      }}>
        <Icon size={20} />
      </Box>
      <Typography variant="h6" fontWeight={700} color="textPrimary">
        {title}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={3}>
      {/* 1. Basic Info Section */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionHeader icon={IconSettings} title="General Settings" />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Assign to Exam</Typography>
            <Select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              fullWidth
              size="small"
            >
              {examsData?.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>{exam.examName}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Category</Typography>
            <TextField
              fullWidth
              size="small"
              value={selectedExam?.category?.name || 'Uncategorized'}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Question Type</Typography>
            <Select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="MCQ">Multiple Choice (MCQ)</MenuItem>
              <MenuItem value="CODE">Programming Problem</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Marks Allotted</Typography>
            <TextField
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Content Section */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionHeader icon={IconQuestionMark} title="Question Details" />
        <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Problem Statement</Typography>
        <TextField
          placeholder="Describe the problem clearly..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 3 }}
        />

        {questionType === 'MCQ' ? (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Define Options</Typography>
            <Stack spacing={2}>
              {newOptions.map((option, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <TextField
                    placeholder={`Option ${index + 1}`}
                    value={newOptions[index]}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[index] = e.target.value;
                      setNewOptions(updated);
                    }}
                    fullWidth
                    size="small"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        icon={<Box sx={{ width: 20, height: 20, border: '2px solid', borderColor: 'divider' }} />}
                        checkedIcon={<Box sx={{ width: 20, height: 20, border: '2px solid', borderColor: 'success.main', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCheck size={14} color="white" /></Box>}
                        checked={correctOptions[index]}
                        onChange={() => handleOptionChange(index)}
                      />
                    }
                    label="Correct"
                    sx={{ mr: 0 }}
                  />
                </Stack>
              ))}
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Input Format</Typography>
                <TextField fullWidth multiline rows={2} size="small" value={inputFormat} onChange={e => setInputFormat(e.target.value)} placeholder="e.g. First line contains n..." />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Output Format</Typography>
                <TextField fullWidth multiline rows={2} size="small" value={outputFormat} onChange={e => setOutputFormat(e.target.value)} placeholder="e.g. Print a single integer..." />
              </Grid>
            </Grid>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Constraints</Typography>
              <TextField fullWidth size="small" value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="e.g. 1 <= N <= 10^5" />
            </Box>

            <Box>
              <SectionHeader icon={IconCode} title="Test Cases" />
              <Stack spacing={2}>
                {testCases.map((tc, idx) => (
                  <Box key={idx} sx={{ p: 2, bgcolor: 'grey.100', position: 'relative' }}>
                    <Stack direction="row" spacing={2} mb={1.5}>
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight={700} color="textSecondary">INPUT</Typography>
                        <TextField multiline rows={2} fullWidth sx={{ bgcolor: 'white' }} value={tc.input} onChange={e => handleTestCaseChange(idx, 'input', e.target.value)} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight={700} color="textSecondary">OUTPUT</Typography>
                        <TextField multiline rows={2} fullWidth sx={{ bgcolor: 'white' }} value={tc.output} onChange={e => handleTestCaseChange(idx, 'output', e.target.value)} />
                      </Box>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <FormControlLabel
                        control={<Checkbox size="small" checked={tc.isHidden} onChange={e => handleTestCaseChange(idx, 'isHidden', e.target.checked)} />}
                        label={<Typography variant="body2">Hidden Case</Typography>}
                      />
                      {testCases.length > 1 && (
                        <Button size="small" startIcon={<IconTrash size={16} />} color="error" onClick={() => removeTestCase(idx)}>
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Box>
                ))}
                <Button
                  startIcon={<IconPlus size={18} />}
                  variant="outlined"
                  onClick={addTestCase}
                  sx={{ borderStyle: 'dashed' }}
                >
                  Add Test Case
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Action Area */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <IconPlus size={20} />}
          onClick={handleAddQuestion}
          disabled={isLoading}
          sx={{ px: 4, py: 1.5 }}
        >
          {isLoading ? 'Processing...' : 'Add Question To Bank'}
        </Button>
      </Box>

      {/* Session Summary */}
      {questions.length > 0 && (
        <Paper sx={{ p: 3, bgcolor: '#f1f4fb', border: '1px solid', borderColor: 'primary.light' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} mt={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 1, display: 'flex', color: 'primary.main' }}>
                <IconListDetails size={20} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="textPrimary">
                Questions Added ({questions.length})
              </Typography>
            </Box>
            <Chip
              label={`Total Marks: ${questions.reduce((sum, q) => sum + (q.marks ?? 1), 0)}`}
              color="primary"
              variant="filled"
              sx={{ fontWeight: 700, fontSize: '13px' }}
            />
          </Box>
          <Stack spacing={1}>
            {questions.map((q, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ mr: 2, fontWeight: 700, color: 'primary.main' }}>#{i + 1}</Typography>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>{q.question}</Typography>
                <Chip label={q.questionType} size="small" variant="outlined" sx={{ ml: 1, fontSize: '10px' }} />
                <Chip
                  label={`${q.marks ?? 1} mark${(q.marks ?? 1) !== 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, fontSize: '10px', fontWeight: 700 }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default AddQuestionForm;
