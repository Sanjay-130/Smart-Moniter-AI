import React from 'react';
import { Box, Typography, Stack, Paper, useMediaQuery } from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InsightsIcon from '@mui/icons-material/Insights';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2.5,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 0,
            color: 'white',
            width: '280px',
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                background: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }
        }}
    >
        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <Icon sx={{ color: '#5D87FF', fontSize: '2rem' }} />
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '0.5px' }}>
                {title}
            </Typography>
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.7, lineHeight: 1.6 }}>
            {description}
        </Typography>
    </Paper>
);

const AuthFeatures = ({ role }) => {
    const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('lg'));

    const features = {
        general: [
            { icon: SecurityIcon, title: 'AI Proctoring', description: 'Advanced face & object detection to maintain exam integrity.' },
            { icon: CodeIcon, title: 'Code Editor', description: 'Powerful IDE-like experience with multi-language support.' },
            { icon: AutoGraphIcon, title: 'Live Analytics', description: 'Real-time monitoring and behavioral insights for evaluators.' },
            { icon: AssignmentTurnedInIcon, title: 'Auto-Grading', description: 'Instant results for objective tests and programming tasks.' }
        ],
        student: [
            { icon: SecurityIcon, title: 'Secure Hub', description: 'Environment hardened against unauthorized resources.' },
            { icon: CodeIcon, title: 'Modern Editor', description: 'Syntax highlighting, auto-complete, and smart indentation.' },
            { icon: VisibilityIcon, title: 'Integrity Check', description: 'Continuous AI monitoring ensuring a fair competition.' },
            { icon: InsightsIcon, title: 'Daily Progress', description: 'Track your performance and improve your coding skills.' }
        ],
        teacher: [
            { icon: VisibilityIcon, title: 'Live Surveillance', description: 'Monitor multiple students concurrently with AI alerts.' },
            { icon: AssignmentTurnedInIcon, title: 'MCQ & Coding', description: 'Automated evaluation for various types of assessments.' },
            { icon: AutoGraphIcon, title: 'Plagiarism Tool', description: 'Sophisticated analysis to detect copied code or text.' },
            { icon: InsightsIcon, title: 'Detailed Reports', description: 'In-depth analytics on class performance and trends.' }
        ],
        admin: [
            { icon: SettingsSuggestIcon, title: 'System Control', description: 'Manage institution settings and global configurations.' },
            { icon: AdminPanelSettingsIcon, title: 'Role Management', description: 'Granular control over teacher and student access.' },
            { icon: SecurityIcon, title: 'Audit Logs', description: 'Full traceability of all administrative system actions.' },
            { icon: AutoGraphIcon, title: 'Global Metrics', description: 'Comprehensive dashboard for institutional analytics.' }
        ]
    };

    const currentFeatures = features[role] || features.general;

    if (!isDesktop) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                display: { xs: 'none', xl: 'flex' }, // Only show on very large screens to avoid any overlap
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 6,
            }}
        >
            <Stack spacing={4} sx={{ pointerEvents: 'auto' }}>
                <FeatureCard {...currentFeatures[0]} />
                <FeatureCard {...currentFeatures[1]} />
            </Stack>
            <Stack spacing={4} sx={{ pointerEvents: 'auto' }}>
                <FeatureCard {...currentFeatures[2]} />
                <FeatureCard {...currentFeatures[3]} />
            </Stack>
        </Box>
    );
};

export default React.memo(AuthFeatures);
