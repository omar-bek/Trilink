import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Stack, 
  useTheme,
  Chip,
  alpha,
  Fade,
  Slide,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  VerifiedUser as VerifiedUserIcon,
  CloudSync as CloudSyncIcon,
  Dashboard as DashboardIcon,
  ArrowForward as ArrowForwardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  GpsFixed as GpsFixedIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { useState, useEffect } from 'react';
import { designTokens } from '@/theme/designTokens';

const { colors, typography: typo, spacing: space, borders, shadows } = designTokens;

export const LandingPage = () => {
  const theme = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <ShoppingCartIcon sx={{ fontSize: 48 }} />,
      title: 'Procurement Management',
      description: 'Streamline your purchase requests and RFQ processes with automated workflows and intelligent routing.',
      color: colors.intelligence.cerulean,
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 48 }} />,
      title: 'Bid Management',
      description: 'Compare bids, evaluate suppliers, and make informed procurement decisions with advanced analytics.',
      color: colors.intelligence.azure,
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 48 }} />,
      title: 'Real-Time Tracking',
      description: 'Track shipments in real-time with GPS integration, live status updates, and predictive analytics.',
      color: colors.semantic.success,
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 48 }} />,
      title: 'Contract Management',
      description: 'Manage contracts, amendments, and compliance with digital signatures and automated workflows.',
      color: colors.semantic.warning,
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control, audit trails, and compliance monitoring.',
      color: colors.intelligence.ceruleanLight,
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 48 }} />,
      title: 'Advanced Analytics',
      description: 'Gain insights with comprehensive analytics, reporting dashboards, and predictive intelligence.',
      color: colors.intelligence.azureLight,
    },
  ];

  const stats = [
    { icon: <BusinessIcon />, value: '500+', label: 'Companies' },
    { icon: <PeopleIcon />, value: '10K+', label: 'Active Users' },
    { icon: <GpsFixedIcon />, value: '50K+', label: 'Shipments Tracked' },
    { icon: <TrendingUpIcon />, value: '99.9%', label: 'Uptime' },
  ];

  const benefits = [
    { icon: <SpeedIcon />, text: 'Streamlined procurement workflows' },
    { icon: <CloudSyncIcon />, text: 'Real-time shipment tracking' },
    { icon: <DashboardIcon />, text: 'Automated bid comparison' },
    { icon: <VerifiedUserIcon />, text: 'Digital contract management' },
    { icon: <AnalyticsIcon />, text: 'Comprehensive analytics' },
    { icon: <SecurityIcon />, text: 'Multi-role access control' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: colors.intelligence.intelligenceGradientDark,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, ${alpha(colors.intelligence.cerulean, 0.3)} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${alpha(colors.intelligence.azure, 0.3)} 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${alpha(colors.intelligence.ceruleanLight, 0.2)} 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          animation: 'pulse 20s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.8 },
          },
        }}
      />

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Fade in={isVisible} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip
              label="Enterprise-Grade Platform"
              sx={{
                mb: 3,
                px: 2,
                py: 0.5,
                background: alpha(colors.intelligence.cerulean, 0.2),
                color: colors.intelligence.ceruleanLight,
                border: `1px solid ${alpha(colors.intelligence.cerulean, 0.3)}`,
                fontSize: typo.fontSize.bodySmall,
                fontWeight: typo.fontWeight.semibold,
                fontFamily: typo.fontFamily.primary,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: typo.fontSize.h1, sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
                fontWeight: typo.fontWeight.extrabold,
                fontFamily: typo.fontFamily.primary,
                background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${colors.intelligence.ceruleanLight} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                lineHeight: typo.lineHeight.tight,
                letterSpacing: typo.letterSpacing.tight,
                textShadow: `0 4px 20px ${alpha(colors.intelligence.cerulean, 0.3)}`,
              }}
            >
              TriLink Platform
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: typo.fontSize.h4, md: typo.fontSize.h3, lg: typo.fontSize.h2 },
                fontWeight: typo.fontWeight.regular,
                fontFamily: typo.fontFamily.primary,
                color: alpha(theme.palette.common.white, 0.9),
                mb: 4,
                maxWidth: '900px',
                mx: 'auto',
                lineHeight: typo.lineHeight.normal,
                letterSpacing: typo.letterSpacing.normal,
              }}
            >
              Transform Your Procurement & Supply Chain with Enterprise-Grade Digital Solutions
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: typo.fontSize.body, md: typo.fontSize.bodyLarge },
                fontFamily: typo.fontFamily.primary,
                color: alpha(colors.base.neutral200, 0.9),
                mb: 6,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: typo.lineHeight.relaxed,
              }}
            >
              Streamline procurement processes, manage contracts, track shipments in real-time, and gain actionable insights with our comprehensive B2B platform designed for enterprise use.
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 5,
                    py: 1.75,
                    fontSize: typo.fontSize.button,
                    fontWeight: typo.fontWeight.semibold,
                    fontFamily: typo.fontFamily.primary,
                    background: theme.palette.common.white,
                    color: colors.intelligence.cerulean,
                    borderRadius: borders.radius.md,
                    boxShadow: shadows.md,
                    '&:hover': {
                      background: alpha(theme.palette.common.white, 0.95),
                      transform: 'translateY(-2px)',
                      boxShadow: shadows.lg,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      px: 5,
                      py: 1.75,
                      fontSize: typo.fontSize.button,
                      fontWeight: typo.fontWeight.semibold,
                      fontFamily: typo.fontFamily.primary,
                      background: theme.palette.common.white,
                      color: colors.intelligence.cerulean,
                      borderRadius: borders.radius.md,
                      boxShadow: shadows.md,
                      '&:hover': {
                        background: alpha(theme.palette.common.white, 0.95),
                        transform: 'translateY(-2px)',
                        boxShadow: shadows.lg,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 5,
                      py: 1.75,
                      fontSize: typo.fontSize.button,
                      fontWeight: typo.fontWeight.semibold,
                      fontFamily: typo.fontFamily.primary,
                      borderColor: alpha(theme.palette.common.white, 0.5),
                      borderWidth: borders.width.medium,
                      color: theme.palette.common.white,
                      borderRadius: borders.radius.md,
                      backdropFilter: 'blur(10px)',
                      background: alpha(theme.palette.common.white, 0.1),
                      '&:hover': {
                        borderColor: theme.palette.common.white,
                        background: alpha(theme.palette.common.white, 0.2),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </Stack>

            {/* Stats Section */}
            <Grid container spacing={4} sx={{ mt: 8 }}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Slide direction="up" in={isVisible} timeout={800 + index * 200}>
                    <Card
                      sx={{
                        background: alpha(theme.palette.common.white, 0.1),
                        backdropFilter: 'blur(10px)',
                        border: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.2)}`,
                        borderRadius: borders.radius.lg,
                        p: 3,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          background: alpha(theme.palette.common.white, 0.15),
                          borderColor: alpha(colors.intelligence.ceruleanLight, 0.4),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          color: colors.intelligence.ceruleanLight,
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: typo.fontWeight.bold,
                          fontFamily: typo.fontFamily.primary,
                          color: theme.palette.common.white,
                          mb: 0.5,
                          fontSize: typo.fontSize.h4,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: alpha(colors.base.neutral200, 0.9),
                          fontSize: typo.fontSize.bodySmall,
                          fontFamily: typo.fontFamily.primary,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Card>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          background: alpha(theme.palette.common.white, 0.05),
          backdropFilter: 'blur(10px)',
          borderTop: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.1)}`,
          borderBottom: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.1)}`,
          py: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Fade in={isVisible} timeout={1200}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: typo.fontSize.h2, md: typo.fontSize.h1 },
                  fontWeight: typo.fontWeight.bold,
                  fontFamily: typo.fontFamily.primary,
                  color: theme.palette.common.white,
                  mb: 2,
                  lineHeight: typo.lineHeight.tight,
                  letterSpacing: typo.letterSpacing.tight,
                }}
              >
                Powerful Features
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: typo.fontSize.bodyLarge,
                  fontFamily: typo.fontFamily.primary,
                  color: alpha(colors.base.neutral200, 0.9),
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: typo.lineHeight.normal,
                }}
              >
                Everything you need to manage your procurement and supply chain operations
              </Typography>
            </Box>
          </Fade>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Slide direction="up" in={isVisible} timeout={1000 + index * 150}>
                  <Card
                    sx={{
                      height: '100%',
                      background: alpha(theme.palette.common.white, 0.95),
                      backdropFilter: 'blur(10px)',
                      borderRadius: borders.radius.lg,
                      border: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.2)}`,
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 16px 48px ${alpha(feature.color, 0.3)}`,
                        borderColor: feature.color,
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                          color: feature.color,
                        },
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        className="feature-icon"
                        sx={{
                          color: feature.color,
                          mb: 3,
                          display: 'flex',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: typo.fontWeight.bold,
                          fontFamily: typo.fontFamily.primary,
                          mb: 2,
                          color: colors.base.blackPearl,
                          textAlign: 'center',
                          fontSize: typo.fontSize.h5,
                          lineHeight: typo.lineHeight.normal,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.base.neutral600,
                          fontFamily: typo.fontFamily.primary,
                          textAlign: 'center',
                          lineHeight: typo.lineHeight.relaxed,
                          fontSize: typo.fontSize.body,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 10, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in={isVisible} timeout={1000}>
              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: typo.fontSize.h2, md: typo.fontSize.h1 },
                    fontWeight: typo.fontWeight.bold,
                    fontFamily: typo.fontFamily.primary,
                    mb: 3,
                    color: theme.palette.common.white,
                    lineHeight: typo.lineHeight.tight,
                    letterSpacing: typo.letterSpacing.tight,
                  }}
                >
                  Why Choose TriLink?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: typo.fontSize.bodyLarge,
                    fontFamily: typo.fontFamily.primary,
                    color: alpha(colors.base.neutral200, 0.9),
                    mb: 4,
                    lineHeight: typo.lineHeight.relaxed,
                  }}
                >
                  Experience a comprehensive platform designed for modern procurement and supply chain
                  management. Our solution combines powerful features with intuitive design to help
                  your organization operate more efficiently and securely.
                </Typography>
                <Stack spacing={2.5}>
                  {benefits.map((benefit, index) => (
                    <Slide key={index} direction="right" in={isVisible} timeout={800 + index * 150}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: borders.radius.md,
                          background: alpha(theme.palette.common.white, 0.1),
                          backdropFilter: 'blur(10px)',
                          border: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.2)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: alpha(theme.palette.common.white, 0.15),
                            transform: 'translateX(8px)',
                            borderColor: alpha(colors.intelligence.ceruleanLight, 0.4),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            color: colors.intelligence.ceruleanLight,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {benefit.icon}
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.common.white,
                            fontWeight: typo.fontWeight.medium,
                            fontFamily: typo.fontFamily.primary,
                            fontSize: typo.fontSize.body,
                            lineHeight: typo.lineHeight.normal,
                          }}
                        >
                          {benefit.text}
                        </Typography>
                      </Box>
                    </Slide>
                  ))}
                </Stack>
              </Box>
            </Fade>
          </Grid>
          <Grid item xs={12} md={6}>
            <Fade in={isVisible} timeout={1500}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(colors.intelligence.cerulean, 0.3)} 0%, ${alpha(colors.intelligence.azure, 0.3)} 100%)`,
                  borderRadius: borders.radius.xl,
                  p: 6,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.2)}`,
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    background: `radial-gradient(circle, ${alpha(colors.intelligence.ceruleanLight, 0.3)} 0%, transparent 70%)`,
                    borderRadius: '50%',
                  },
                }}
              >
                <TrendingUpIcon
                  sx={{
                    fontSize: 100,
                    color: theme.palette.common.white,
                    mb: 3,
                    opacity: 0.9,
                    zIndex: 1,
                    position: 'relative',
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.common.white,
                    fontWeight: typo.fontWeight.bold,
                    fontFamily: typo.fontFamily.primary,
                    mb: 2,
                    zIndex: 1,
                    position: 'relative',
                    fontSize: typo.fontSize.h4,
                    lineHeight: typo.lineHeight.normal,
                  }}
                >
                  Boost Efficiency
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: alpha(theme.palette.common.white, 0.9),
                    fontFamily: typo.fontFamily.primary,
                    fontSize: typo.fontSize.bodyLarge,
                    lineHeight: typo.lineHeight.relaxed,
                    zIndex: 1,
                    position: 'relative',
                  }}
                >
                  Reduce processing time and improve accuracy with automated workflows and
                  real-time collaboration. Experience seamless integration across all your
                  procurement processes.
                </Typography>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: alpha(theme.palette.common.white, 0.05),
          backdropFilter: 'blur(10px)',
          borderTop: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.1)}`,
          py: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="md">
          <Fade in={isVisible} timeout={1000}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: typo.fontSize.h2, md: typo.fontSize.h1 },
                  fontWeight: typo.fontWeight.bold,
                  fontFamily: typo.fontFamily.primary,
                  color: theme.palette.common.white,
                  mb: 3,
                  lineHeight: typo.lineHeight.tight,
                  letterSpacing: typo.letterSpacing.tight,
                }}
              >
                Ready to Get Started?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: alpha(colors.base.neutral200, 0.9),
                  fontFamily: typo.fontFamily.primary,
                  mb: 5,
                  fontSize: typo.fontSize.bodyLarge,
                  lineHeight: typo.lineHeight.relaxed,
                }}
              >
                Join hundreds of organizations already using TriLink to transform their procurement
                processes and achieve operational excellence.
              </Typography>
              {!isAuthenticated && (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      px: 5,
                      py: 1.75,
                      fontSize: typo.fontSize.button,
                      fontWeight: typo.fontWeight.semibold,
                      fontFamily: typo.fontFamily.primary,
                      background: theme.palette.common.white,
                      color: colors.intelligence.cerulean,
                      borderRadius: borders.radius.md,
                      boxShadow: shadows.md,
                      '&:hover': {
                        background: alpha(theme.palette.common.white, 0.95),
                        transform: 'translateY(-2px)',
                        boxShadow: shadows.lg,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Create Account
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 5,
                      py: 1.75,
                      fontSize: typo.fontSize.button,
                      fontWeight: typo.fontWeight.semibold,
                      fontFamily: typo.fontFamily.primary,
                      borderColor: alpha(theme.palette.common.white, 0.5),
                      borderWidth: borders.width.medium,
                      color: theme.palette.common.white,
                      borderRadius: borders.radius.md,
                      backdropFilter: 'blur(10px)',
                      background: alpha(theme.palette.common.white, 0.1),
                      '&:hover': {
                        borderColor: theme.palette.common.white,
                        background: alpha(theme.palette.common.white, 0.2),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              )}
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          background: alpha(colors.base.blackPearl, 0.8),
          backdropFilter: 'blur(10px)',
          borderTop: `${borders.width.thin} solid ${alpha(theme.palette.common.white, 0.1)}`,
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: alpha(colors.base.neutral300, 0.8),
              fontFamily: typo.fontFamily.primary,
              fontSize: typo.fontSize.bodySmall,
            }}
          >
            © {new Date().getFullYear()} TriLink Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
