import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Grid, Box, Button, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import { useGetExamsQuery, useGetCategoriesQuery } from 'src/slices/examApiSlice';
import defaultCategoryImg from 'src/assets/images/final-exam-results-test-reading-books-words-concept.jpg';
import { useNavigate } from 'react-router-dom';


const Exams = () => {
  // Fetch exam data from the backend using useGetExamsQuery
  const { data: userExams = [], isLoading, isError } = useGetExamsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const examsByCategory = useMemo(() => {
    const map = {};
    // initialize with categories (sorted by name)
    (categories || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((c) => {
        map[c._id] = { category: c, exams: [] };
      });
    // Uncategorized bucket
    map.uncategorized = { category: { _id: 'uncategorized', name: 'Uncategorized' }, exams: [] };

    (userExams || [])
      .slice()
      .sort((a, b) => (a.examName || '').localeCompare(b.examName || ''))
      .forEach((exam) => {
        if (exam.category && exam.category._id && map[exam.category._id]) {
          map[exam.category._id].exams.push(exam);
        } else {
          map.uncategorized.exams.push(exam);
        }
      });

    return Object.values(map);
  }, [userExams, categories]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching exams.</div>;
  }

  return (
    <PageContainer title="Exams" description="List of exams grouped by category">
      {/* Render categories-only: each category is a card with name, count, and actions */}
      <Grid container spacing={3}>
        {examsByCategory.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.category._id}>
            <BlankCard>
              {/* category image / preview */}
              <Box
                component="img"
                src={group.category.image || defaultCategoryImg || `https://source.unsplash.com/800x400/?${encodeURIComponent(group.category.name || 'education')}`}
                alt={group.category.name}
                onClick={() => navigate(`/exam/category/${group.category._id}`)}
                sx={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  cursor: 'pointer'
                }}
              />
              <Box p={3}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/exam/category/${group.category._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/exam/category/${group.category._id}`);
                  }}
                  sx={{ cursor: 'pointer', minWidth: 0 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', noWrap: true }}>
                      {group.category.name}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(26,35,126,0.05)',
                        color: 'primary.main',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {(group.exams && group.exams.length) || 0} TESTS
                      </Typography>
                    </Box>
                  </Stack>

                  {group.category.description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        fontWeight: 400,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6
                      }}
                    >
                      {group.category.description}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Explore various assessments in this category.
                    </Typography>
                  )}
                </Box>

                {userInfo?.role === 'teacher' && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
                    onClick={() => navigate(`/create-exam?category=${group.category._id}`)}
                  >
                    Create Test
                  </Button>
                )}
              </Box>
            </BlankCard>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default Exams;
