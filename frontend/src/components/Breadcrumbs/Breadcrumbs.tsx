import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBreadcrumbs } from '@/config/navigation';

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if only on home
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        if (isLast) {
          return (
            <Typography key={crumb.path} color="text.primary" sx={{ fontWeight: 500 }}>
              {crumb.label}
            </Typography>
          );
        }

        return (
          <Link
            key={crumb.path}
            component="button"
            variant="body2"
            onClick={() => navigate(crumb.path)}
            aria-label={`Navigate to ${crumb.label}`}
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
                borderRadius: '4px',
              },
              cursor: 'pointer',
            }}
          >
            {crumb.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
