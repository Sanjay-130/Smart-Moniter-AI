import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Stack,
    Button,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tabs,
    Tab,
} from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

import { useCompileCodeMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CodeIcon from '@mui/icons-material/Code';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function CodeQuestion({
    questions,
    studentAnswers,
    saveUserTestScore,
    saveStudentAnswer,
    submitTest,
    currentQuestion = 0,
    setCurrentQuestion,
    onAnswered,
    // onSelectionChange,
}) {
    const q = questions[currentQuestion];
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [testResults, setTestResults] = useState([]);
    const [consoleOutput, setConsoleOutput] = useState({ stdout: '', stderr: '', hasError: false });
    const [isRunning, setIsRunning] = useState(false);
    const [editorTheme, setEditorTheme] = useState('dark');
    const [customInput, setCustomInput] = useState('');
    const [outputTab, setOutputTab] = useState(0); // 0=Test Results, 1=Console
    const [hasRun, setHasRun] = useState(false);

    const getLanguageExtension = (lang) => {
        switch (lang) {
            case 'python': return [python()];
            case 'javascript': return [javascript({ jsx: true })];
            case 'java': return [java()];
            case 'cpp':
            case 'c':
                return [cpp()];
            default: return [];
        }
    };

    const [compileCode] = useCompileCodeMutation();
    const [isLastQuestion, setIsLastQuestion] = useState(false);

    // Simple, clean language starter templates.
    // Each just provides the minimal boilerplate so the student can start coding immediately.
    const getLanguageDefaults = (lang) => {
        const templates = {

            python: `import sys
input = sys.stdin.readline

# Write your code here
`,

            javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\n');
let idx = 0;
const nextLine = () => lines[idx++];

// Write your code here
`,

            java: `import java.util.Scanner;

// Note: Use "class Solution" (not "public class")
class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your code here
    }
}
`,

            cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    return 0;
}
`,

            c: `#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}
`,
        };
        return templates[lang] || '// Write your code here\n';
    };


    useEffect(() => {
        if (questions && questions.length > 0) {
            setIsLastQuestion(currentQuestion === questions.length - 1);
        }

        // Always start fresh with the clean template — no code is saved between visits.
        // This ensures each question opens with a clean slate.
        setCode(getLanguageDefaults('python'));
        setLanguage('python');
        setConsoleOutput({ stdout: '', stderr: '', hasError: false });
        setTestResults([]);
        setHasRun(false);
        setOutputTab(0);
    }, [currentQuestion, questions]);

    const handleCodeChange = (value) => {
        setCode(value || '');
        // Save the answer with both code and language
        const answerData = { code: value || '', language };
        if (saveStudentAnswer) saveStudentAnswer(q._id, answerData);
    };

    const handleLanguageChange = (event) => {
        const newLang = event.target.value;
        setLanguage(newLang);
        const template = getLanguageDefaults(newLang);
        setCode(template);
        // Save the answer with both code and new language
        const answerData = { code: template, language: newLang };
        if (saveStudentAnswer) saveStudentAnswer(q._id, answerData);
    };

    const executeCode = async () => {
        if (!code.trim()) {
            toast.error('Please write some code before running.');
            return;
        }
        setIsRunning(true);
        setTestResults([]);
        setConsoleOutput({ stdout: '', stderr: '', hasError: false });
        setHasRun(true);

        const testCases = q.codeQuestion?.testCases || [];

        // If no test cases, do a free run with custom input and show console
        if (testCases.length === 0) {
            try {
                const res = await compileCode({ language, code, input: customInput }).unwrap();
                const stdout = res.run?.stdout ?? '';
                const stderr = res.run?.stderr ?? '';
                // Compile error comes back in stderr with non-zero exit code
                const hasError = !!(stderr && stderr.trim()) || (res.run?.code !== 0 && res.run?.code !== undefined);
                setConsoleOutput({ stdout, stderr, hasError });
                setOutputTab(1); // switch to Console tab
            } catch (err) {
                setConsoleOutput({ stdout: '', stderr: err?.data?.message || err.message || 'Unknown error', hasError: true });
                setOutputTab(1);
            } finally {
                setIsRunning(false);
            }
            return;
        }

        // Run against all test cases
        const results = [];
        let lastStdout = '';
        let lastStderr = '';
        try {
            for (const tc of testCases) {
                const res = await compileCode({ language, code, input: tc.input ?? '' }).unwrap();
                const stdout = res.run?.stdout ?? '';
                const stderr = res.run?.stderr ?? '';
                lastStdout = stdout;
                lastStderr = stderr;

                // Execution error: non-zero exit or stderr present without stdout
                const hasExecError = stderr.trim() && !stdout.trim();
                const actualOutput = hasExecError ? '' : stdout.trim();
                const passed = !hasExecError && (actualOutput === (tc.output ?? '').trim());

                results.push({
                    input: tc.input ?? '',
                    expected: tc.output ?? '',
                    actual: actualOutput,
                    stderr: stderr.trim(),
                    passed,
                    isHidden: tc.isHidden,
                });
            }

            setTestResults(results);
            setConsoleOutput({ stdout: lastStdout, stderr: lastStderr, hasError: !!lastStderr.trim() });
            setOutputTab(0); // show test results
        } catch (err) {
            const errMsg = err?.data?.message || err.message || 'Compilation/execution failed';
            setConsoleOutput({ stdout: '', stderr: errMsg, hasError: true });
            setOutputTab(1);
            toast.error(errMsg);
        } finally {
            setIsRunning(false);
        }
    };

    const handleNext = () => {
        const passedCount = testResults.filter(r => r.passed).length;
        const totalCount = testResults.length || (q.codeQuestion?.testCases?.length || 0);
        const isAllPassed = passedCount === totalCount && totalCount > 0;

        if (saveStudentAnswer) {
            const answerData = { 
                code, 
                language, 
                isCorrect: isAllPassed,
                passedTestCases: passedCount,
                totalTestCases: totalCount
            };
            saveStudentAnswer(q._id, answerData);
        }

        let status = 'attended';
        if (totalCount > 0) {
            if (isAllPassed) {
                status = 'correct'; // Full correct (Green)
            } else if (passedCount > 0) {
                status = 'partial'; // Partially correct (Yellow)
            } else {
                status = 'error'; // Error in code/All Failed (Red)
            }
        }

        if (onAnswered) onAnswered(currentQuestion, status);
        if (isAllPassed) saveUserTestScore();

        if (currentQuestion < questions.length - 1 && setCurrentQuestion) {
            setCurrentQuestion(currentQuestion + 1);
        } else if (submitTest) {
            submitTest();
        }
    };

    const allTestsPassed = testResults.length > 0 && testResults.every((r) => r.passed);

    // Get visible (example) test cases for display
    const exampleTestCases = (q.codeQuestion?.testCases || []).filter(tc => !tc.isHidden).slice(0, 2);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Question Header */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Question {currentQuestion + 1}: Programming Challenge
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.7 }}>
                    {q.question}
                </Typography>
            </Paper>

            {/* Problem Specification */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                    {/* Input Format */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A237E', mb: 1 }}>
                            <InputIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
                            Input Format
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {q.codeQuestion?.inputFormat || 'Not specified'}
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Output Format */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0D47A1', mb: 1 }}>
                            <OutputIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
                            Output Format
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {q.codeQuestion?.outputFormat || 'Not specified'}
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Constraints */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                            ⚖️ Constraints
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
                                {(q.codeQuestion?.constraints || 'Not specified').split('\n').map((line, i) => (
                                    <Box key={i} sx={{ mb: 0.5 }}>• {line.trim()}</Box>
                                ))}
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Example Test Cases */}
                    {exampleTestCases.length > 0 && (
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff6b6b', mb: 1 }}>
                                📝 Example Test Cases
                            </Typography>
                            <Stack spacing={1.5}>
                                {exampleTestCases.map((tc, idx) => (
                                    <Paper key={idx} sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea' }}>
                                            Example {idx + 1}
                                        </Typography>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                    Input:
                                                </Typography>
                                                <Paper sx={{ p: 1, bgcolor: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    {tc.input || '(empty)'}
                                                </Paper>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                    Output:
                                                </Typography>
                                                <Paper sx={{ p: 1, bgcolor: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    {tc.output || '(empty)'}
                                                </Paper>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </Paper>

            {/* Editor Controls */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ px: 1, gap: 1 }}>
                {/* Language Selector */}
                <Select
                    size="small"
                    value={language}
                    onChange={handleLanguageChange}
                    sx={{ minWidth: 160, bgcolor: 'white', fontWeight: 600 }}
                >
                    <MenuItem value="python">🐍 Python 3</MenuItem>
                    <MenuItem value="javascript">⚡ JavaScript</MenuItem>
                    <MenuItem value="java">☕ Java</MenuItem>
                    <MenuItem value="cpp">⚙️ C++</MenuItem>
                    <MenuItem value="c">🔩 C</MenuItem>
                </Select>

                {/* Theme Selector */}
                <Select
                    size="small"
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="dark">🌙 Dark</MenuItem>
                    <MenuItem value="light">☀️ Light</MenuItem>
                </Select>

                <Box sx={{ flex: 1 }} />

                {allTestsPassed && (
                    <Chip icon={<CheckCircleIcon />} label="All Tests Passed!" color="success" sx={{ fontWeight: 700 }} />
                )}

                {/* Run Button */}
                <Button
                    variant="contained"
                    size="large"
                    startIcon={isRunning ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                    onClick={executeCode}
                    disabled={isRunning}
                    sx={{
                        background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #0D47A1 0%, #002171 100%)' },
                        textTransform: 'none', fontWeight: 700, px: 3,
                    }}
                >
                    {isRunning ? 'Running...' : '▶ Run Code'}
                </Button>
            </Stack>

            {/* CodeMirror Editor */}
            <Paper
                elevation={4}
                sx={{
                    height: 500,
                    overflow: 'auto',
                    borderRadius: 2,
                    border: '2px solid #e0e0e0',
                    '& .cm-editor': {
                        height: '100%',
                        fontSize: '15px',
                        fontFamily: "'Fira Code', 'Courier New', monospace",
                    },
                    '& .cm-scroller': {
                        overflow: 'auto'
                    }
                }}
            >
                <CodeMirror
                    value={code}
                    height="500px"
                    theme={editorTheme === 'dark' ? vscodeDark : 'light'}
                    extensions={getLanguageExtension(language)}
                    onChange={handleCodeChange}
                    basicSetup={{
                        lineNumbers: true,
                        bracketMatching: true,
                        highlightActiveLine: true,
                        closeBrackets: true,
                        autocompletion: true,
                        foldGutter: true,
                        highlightSelectionMatches: true,
                    }}
                />
            </Paper>

            {/* Custom Input (shown when no test cases) */}
            {(q.codeQuestion?.testCases || []).length === 0 && (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={0.75}>
                        <InputIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Custom Input (stdin)
                    </Typography>
                    <TextField
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        placeholder="Enter custom input here (one value per line)..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        sx={{ fontFamily: 'monospace', '& textarea': { fontFamily: 'monospace', fontSize: '0.9rem' } }}
                    />
                </Box>
            )}

            {/* Output Section */}
            {hasRun && (
                <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', mt: 1 }}>
                    {/* Output Header */}
                    <Box sx={{
                        px: 3, py: 1.5,
                        background: (() => {
                            if (testResults.length > 0) {
                                const passed = testResults.filter(r => r.passed).length;
                                if (passed === testResults.length) return '#2e7d32';
                                if (passed > 0) return '#ed6c02';
                                return '#c62828';
                            }
                            return consoleOutput.hasError ? '#c62828' : '#1A237E';
                        })(),
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                            {testResults.length > 0
                                ? `Test Results: ${testResults.filter(r => r.passed).length}/${testResults.length} Passed`
                                : consoleOutput.hasError ? '❌ Runtime / Compile Error' : '✅ Execution Output'}
                        </Typography>
                        {testResults.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {testResults.every(r => r.passed)
                                    ? <CheckCircleIcon sx={{ fontSize: 20 }} />
                                    : <CancelIcon sx={{ fontSize: 20 }} />}
                            </Stack>
                        )}
                    </Box>

                    {/* Tabs: Test Results | Console */}
                    {testResults.length > 0 && (
                        <Box sx={{ borderBottom: '1px solid #e0e0e0' }}>
                            <Tabs value={outputTab} onChange={(_, v) => setOutputTab(v)} sx={{ px: 2, minHeight: 40 }}>
                                <Tab label="Test Results" sx={{ fontWeight: 700, fontSize: '0.85rem', minHeight: 40 }} />
                                <Tab label="Console" sx={{ fontWeight: 700, fontSize: '0.85rem', minHeight: 40 }} />
                            </Tabs>
                        </Box>
                    )}

                    {/* Test Results Table */}
                    {outputTab === 0 && testResults.length > 0 && (() => {
                        const BORDER = '1.5px solid #111';
                        const HD_BG = '#1A237E';

                        // ── Row theme per result type ──────────────────────────
                        // passed            → full green
                        // hidden + failed   → amber / dark-yellow
                        // visible + failed  → red
                        const getRowTheme = (res) => {
                            if (res.passed) return {
                                rowBg: '#e8f5e9',          // soft green wash
                                borderColor: '#66bb6a',
                                textColor: '#1b5e20',
                                pillBg: '#c8e6c9',
                                pillBorder: '#81c784',
                                iconColor: '#2e7d32',
                                badgeBg: '#a5d6a7',
                                badgeBorder: '#388e3c',
                                badgeColor: '#1b5e20',
                            };
                            if (res.isHidden) return {
                                rowBg: '#fff8e1',          // amber / dark-yellow wash
                                borderColor: '#ffb300',
                                textColor: '#e65100',
                                pillBg: '#ffecb3',
                                pillBorder: '#ffd54f',
                                iconColor: '#f57c00',
                                badgeBg: '#ffe082',
                                badgeBorder: '#ffb300',
                                badgeColor: '#e65100',
                            };
                            return {
                                rowBg: '#ffebee',          // red wash
                                borderColor: '#ef9a9a',
                                textColor: '#b71c1c',
                                pillBg: '#ffcdd2',
                                pillBorder: '#ef9a9a',
                                iconColor: '#c62828',
                                badgeBg: '#ef9a9a',
                                badgeBorder: '#c62828',
                                badgeColor: '#b71c1c',
                            };
                        };

                        const cellBase = (theme) => ({
                            border: `1.5px solid ${theme.borderColor}`,
                            py: 1.5,
                            px: 2,
                            verticalAlign: 'middle',
                            bgcolor: theme.rowBg,
                        });

                        const valuePill = (theme, extra = {}) => ({
                            fontFamily: 'monospace',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: theme.textColor,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            bgcolor: theme.pillBg,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1,
                            border: `1px solid ${theme.pillBorder}`,
                            ...extra,
                        });

                        const sorted = [...testResults].sort((a, b) =>
                            a.isHidden === b.isHidden ? 0 : a.isHidden ? 1 : -1
                        );

                        return (
                            <TableContainer sx={{ border: `1.5px solid #111`, borderTop: 'none' }}>
                                <Table sx={{ tableLayout: 'fixed', minWidth: 520, borderCollapse: 'collapse' }}>

                                    {/* ── Header ── */}
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: HD_BG }}>
                                            {['Status', 'Input', 'Expected Output', 'Your Output'].map((h, hi) => (
                                                <TableCell key={h} sx={{
                                                    border: '1.5px solid #3949ab',
                                                    py: 1.5, px: 2,
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: '0.82rem',
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    width: hi === 0 ? 80 : 'auto',
                                                    textAlign: hi === 0 ? 'center' : 'left',
                                                }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    {/* ── Rows ── */}
                                    <TableBody>
                                        {sorted.map((res, idx) => {
                                            const th = getRowTheme(res);
                                            const cb = cellBase(th);

                                            return (
                                                <TableRow key={idx}>

                                                    {/* Status cell */}
                                                    <TableCell sx={{ ...cb, textAlign: 'center', width: 80 }}>
                                                        {res.passed
                                                            ? <CheckCircleIcon sx={{ color: th.iconColor, fontSize: 30 }} />
                                                            : <CancelIcon sx={{ color: th.iconColor, fontSize: 30 }} />}
                                                    </TableCell>

                                                    {res.isHidden ? (
                                                        /* ── Hidden test case ── */
                                                        <>
                                                            {/* Input hidden badge */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 0.6,
                                                                    bgcolor: th.badgeBg, color: th.badgeColor,
                                                                    px: 1.5, py: 0.5, borderRadius: 1,
                                                                    border: `1.5px solid ${th.badgeBorder}`,
                                                                    fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.02em',
                                                                }}>
                                                                    🔒 Hidden Input
                                                                </Box>
                                                            </TableCell>

                                                            {/* Expected hidden badge */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 0.6,
                                                                    bgcolor: th.badgeBg, color: th.badgeColor,
                                                                    px: 1.5, py: 0.5, borderRadius: 1,
                                                                    border: `1.5px solid ${th.badgeBorder}`,
                                                                    fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.02em',
                                                                }}>
                                                                    🔒 Hidden Output
                                                                </Box>
                                                            </TableCell>

                                                            {/* Your output */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={valuePill(th)}>
                                                                    {res.stderr
                                                                        ? <Box><ErrorOutlineIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle' }} />{res.stderr.slice(0, 200)}</Box>
                                                                        : (res.actual || <em style={{ opacity: 0.5 }}>no output</em>)}
                                                                </Box>
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        /* ── Visible test case ── */
                                                        <>
                                                            {/* Input */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={valuePill(th)}>
                                                                    {res.input || <em style={{ opacity: 0.5 }}>empty</em>}
                                                                </Box>
                                                            </TableCell>

                                                            {/* Expected */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={valuePill(th)}>
                                                                    {res.expected || <em style={{ opacity: 0.5 }}>empty</em>}
                                                                </Box>
                                                            </TableCell>

                                                            {/* Your output */}
                                                            <TableCell sx={cb}>
                                                                <Box sx={valuePill(th, { fontWeight: 700 })}>
                                                                    {res.stderr
                                                                        ? <Box><ErrorOutlineIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle' }} />{res.stderr.slice(0, 200)}</Box>
                                                                        : (res.actual || <em style={{ opacity: 0.5 }}>no output</em>)}
                                                                </Box>
                                                            </TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        );
                    })()}


                    {/* Console / raw output */}
                    {(outputTab === 1 || testResults.length === 0) && (
                        <Box sx={{ p: 2.5 }}>
                            {consoleOutput.stdout && (
                                <Box mb={consoleOutput.stderr ? 2 : 0}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>STDOUT</Typography>
                                    <Box sx={{ p: 2, bgcolor: '#111827', borderRadius: 1.5, fontFamily: 'monospace', fontSize: '0.88rem', color: '#a5f3a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 220, overflow: 'auto' }}>
                                        {consoleOutput.stdout}
                                    </Box>
                                </Box>
                            )}
                            {consoleOutput.stderr && (
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="error.main" sx={{ display: 'block', mb: 0.5 }}>STDERR / ERROR</Typography>
                                    <Box sx={{ p: 2, bgcolor: '#1a0000', borderRadius: 1.5, fontFamily: 'monospace', fontSize: '0.88rem', color: '#ff8a8a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 220, overflow: 'auto' }}>
                                        {consoleOutput.stderr}
                                    </Box>
                                </Box>
                            )}
                            {!consoleOutput.stdout && !consoleOutput.stderr && (
                                <Typography variant="body2" color="text.disabled" fontStyle="italic">No output produced.</Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            )}

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                <Button
                    variant="contained"
                    size="large"
                    endIcon={<NavigateNextIcon />}
                    onClick={handleNext}
                    sx={{
                        background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #0D47A1 0%, #002171 100%)' },
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 5,
                        py: 1.5,
                        fontSize: '1rem',
                    }}
                >
                    {isLastQuestion ? '🏁 Finish Test' : 'Next Question →'}
                </Button>
            </Box>
        </Box>
    );
}

