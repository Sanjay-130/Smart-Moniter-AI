import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea, Rating, Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import { Link, useNavigate } from 'react-router-dom';

const imgUrl =
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNvbXB1dGVyJTIwc2NpZW5jZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80';
export default function ExamCard({ exam }) {
  const { examName, duration, totalQuestions, _id, liveDate, deadDate } = exam;

  // handling routes
  const navigate = useNavigate();
  const isExamActive = true; // Date.now() >= liveDate && Date.now() <= deadDate;
  const handleCardClick = () => {
    if (isExamActive) {
      // Navigate to the /exam/_id route when the exam is active
      // Password verification will happen on the ExamDetails page
      navigate(`/exam/${_id}`);
    }
  };

  return (
    <CardActionArea onClick={handleCardClick} sx={{ borderRadius: 3 }}>
      <CardMedia
        component="img"
        height="160"
        image={imgUrl}
        alt={examName}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ p: 3 }}>
        <Typography
          gutterBottom
          variant="h5"
          component="div"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
        >
          {examName}
        </Typography>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 500, mb: 2 }}
        >
          MCQ Assessment
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(26,35,126,0.05)',
              color: 'primary.main'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {totalQuestions} Ques
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, opacity: 0.8 }}
          >
            {duration} Mins
          </Typography>
        </Stack>
      </CardContent>
    </CardActionArea>
  );
}
