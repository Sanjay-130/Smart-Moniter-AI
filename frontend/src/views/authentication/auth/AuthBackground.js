import React, { useMemo } from 'react';
import { Box } from '@mui/material';

const AuthBackground = () => {
    // Memoize stars to prevent re-calculation on setiap render
    const stars = useMemo(() => {
        return [...Array(60)].map((_, i) => ({
            id: i,
            size: i % 3 === 0 ? '2px' : '1px',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 5,
            hasGlow: i % 8 === 0,
        }));
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                overflow: 'hidden',
                background: 'linear-gradient(to bottom, #020617 0%, #051937 50%, #004d7a 100%)',
            }}
        >
            {/* Animated Scanning Lines - more subtle */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent, rgba(93, 135, 255, 0.02), transparent)',
                    backgroundSize: '100% 600px',
                    animation: 'scan 15s linear infinite',
                    zIndex: 1,
                    willChange: 'background-position',
                    '@keyframes scan': {
                        '0%': { backgroundPosition: '0 -600px' },
                        '100%': { backgroundPosition: '0 100vh' },
                    },
                }}
            />

            {/* Stars Layers */}
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {stars.map((star) => (
                    <Box
                        key={`star-${star.id}`}
                        sx={{
                            position: 'absolute',
                            width: star.size,
                            height: star.size,
                            bgcolor: 'white',
                            borderRadius: '50%',
                            top: star.top,
                            left: star.left,
                            opacity: star.opacity,
                            boxShadow: star.hasGlow ? '0 0 6px 1px rgba(255, 255, 255, 0.8)' : 'none',
                            animation: `twinkle ${star.duration}s ease-in-out infinite`,
                            animationDelay: `${star.delay}s`,
                            willChange: 'opacity, transform',
                            '@keyframes twinkle': {
                                '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                                '50%': { opacity: 1, transform: 'scale(1.2)' },
                            },
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default React.memo(AuthBackground);
