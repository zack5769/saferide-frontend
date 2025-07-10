// src/components/Layout/AppLayout.tsx
import { ReactNode } from 'react';
import { Box } from '@mui/material';

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export default function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        bgcolor: 'background.default',
        overflow: 'hidden',
        pb: hideNavigation ? 0 : 7,
      }}
    >
      {children}
    </Box>
  );
}