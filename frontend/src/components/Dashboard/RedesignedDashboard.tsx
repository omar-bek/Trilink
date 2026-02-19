/**
 * Redesigned Dashboard
 * 
 * Modern, organized dashboard layout with:
 * - Clean section headers
 * - Better visual hierarchy
 * - Improved spacing and organization
 * - Enhanced card designs
 * - Responsive grid layout
 */

import { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Typography, Paper, Divider } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { ExecutiveKPICard } from './ExecutiveKPICard';
import { CriticalAlertsBanner } from './CriticalAlertsBanner';
import { RecentActivity } from './RecentActivity';
import { RoleBasedWidgets } from './RoleBasedWidgets';
import { NotificationsWidget } from './NotificationsWidget';
import { DashboardSkeleton } from '@/components/LoadingSkeleton/EnhancedSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { roleKPIConfigs } from '@/config/dashboardKPIs';
import { useNavigate } from 'react-router-dom';
import {
    Dashboard as DashboardIcon,
    BarChart as BarChartIcon,
} from '@mui/icons-material';

interface RedesignedDashboardProps {
    dashboardData: any;
    recentActivity: any[];
    criticalAlerts: any[];
    isLoading: boolean;
    isLoadingActivity: boolean;
    isLoadingAlerts: boolean;
}

const SectionHeader = ({
    title,
    icon,
    subtitle
}: {
    title: string;
    icon: React.ReactNode;
    subtitle?: string;
}) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'rgba(70, 130, 180, 0.15)',
                        color: '#4682B4',
                    }}
                >
                    {icon}
                </Box>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontSize: { xs: '20px', md: '24px' },
                    }}
                >
                    {title}
                </Typography>
            </Box>
            {subtitle && (
                <Typography
                    variant="body2"
                    sx={{
                        color: '#94A3B8',
                        ml: 7,
                        fontSize: '14px',
                    }}
                >
                    {subtitle}
                </Typography>
            )}
            <Divider sx={{ mt: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        </Box>
    );
};

export const RedesignedDashboard = ({
    dashboardData,
    recentActivity,
    criticalAlerts,
    isLoading,
    isLoadingActivity,
    isLoadingAlerts,
}: RedesignedDashboardProps) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const role = user?.role as Role;

    // Progressive loading states
    const [showKPIs, setShowKPIs] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Intersection observers
    const { ref: chartsRef, inView: chartsInView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    const { ref: activityRef, inView: activityInView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    const { ref: notificationsRef, inView: notificationsInView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // Priority-based rendering
    useEffect(() => {
        const kpiTimer = setTimeout(() => setShowKPIs(true), 100);
        const chartsTimer = setTimeout(() => {
            if (chartsInView) setShowCharts(true);
        }, 500);
        const activityTimer = setTimeout(() => {
            if (activityInView) setShowActivity(true);
        }, 300);
        const notificationsTimer = setTimeout(() => {
            if (notificationsInView) setShowNotifications(true);
        }, 300);

        return () => {
            clearTimeout(kpiTimer);
            clearTimeout(chartsTimer);
            clearTimeout(activityTimer);
            clearTimeout(notificationsTimer);
        };
    }, [chartsInView, activityInView, notificationsInView]);

    // Force show when data is ready
    useEffect(() => {
        if (!isLoading && dashboardData) setShowKPIs(true);
    }, [isLoading, dashboardData]);

    useEffect(() => {
        if (!isLoadingActivity && recentActivity.length > 0) setShowActivity(true);
    }, [isLoadingActivity, recentActivity]);

    useEffect(() => {
        if (!isLoading && dashboardData?.charts) setShowCharts(true);
    }, [isLoading, dashboardData]);

    // Handle multiple response structures
    // Handle multiple response structures
    const kpis = dashboardData?.data?.kpis || dashboardData?.data?.data?.kpis || dashboardData?.kpis;
    const charts = dashboardData?.data?.charts || dashboardData?.data?.data?.charts || dashboardData?.charts;

    // Debug: Log KPIs to console in development
    if (import.meta.env.DEV && kpis) {
        console.log('Dashboard KPIs:', kpis);
    }

    // Get role-specific KPIs
    const executiveKPIs = useMemo(() => {
        if (!kpis) {
            console.warn('No KPIs data available', { dashboardData, kpis });
            return [];
        }

        const kpiConfigs = roleKPIConfigs[role] || roleKPIConfigs[Role.BUYER];

        return kpiConfigs.map((config) => {
            const value = kpis[config.valueKey as keyof typeof kpis];
            // Use 0 as default if value is undefined or null, but keep 0 if it's actually 0
            const finalValue = value !== undefined && value !== null ? value : 0;
            let formattedValue: string | number = finalValue;

            if (config.unit === 'USD' || config.unit === 'AED') {
                formattedValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: config.unit === 'USD' ? 'USD' : 'AED',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(Number(finalValue));
            } else if (config.unit === '%') {
                formattedValue = typeof finalValue === 'number' ? finalValue.toFixed(1) : finalValue;
            }

            let subtitle: string | undefined;
            if (config.subtitleKey && kpis[config.subtitleKey as keyof typeof kpis]) {
                const subtitleValue = kpis[config.subtitleKey as keyof typeof kpis];
                if (typeof subtitleValue === 'number') {
                    subtitle = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(subtitleValue);
                }
            }

            let trend: { value: number; label: string } | undefined;
            if (config.trendKey && kpis[config.trendKey as keyof typeof kpis]) {
                const trendValue = kpis[config.trendKey as keyof typeof kpis];
                if (typeof trendValue === 'number') {
                    trend = {
                        value: trendValue,
                        label: 'vs last month',
                    };
                }
            }

            return {
                ...config,
                value: formattedValue,
                subtitle,
                trend,
            };
        });
    }, [kpis, role]);

    // Show skeleton only on initial load
    if (isLoading && !dashboardData) {
        return <DashboardSkeleton />;
    }

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                flexDirection: 'column',
                pb: 4,
            }}
        >
            {/* Critical Alerts - Priority 1: Immediate */}
            {criticalAlerts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <CriticalAlertsBanner alerts={criticalAlerts} loading={isLoadingAlerts} />
                </Box>
            )}

            {/* Main Content Container */}
            <Box sx={{ flex: 1 }}>
                {/* KPI Section */}
                <Box sx={{ mb: 5 }}>
                    <SectionHeader
                        title="Key Performance Indicators"
                        icon={<DashboardIcon />}
                        subtitle="Overview of your business metrics"
                    />
                    {showKPIs && (
                        <Grid container spacing={3}>
                            {executiveKPIs.map((kpi) => (
                                <Grid item xs={12} sm={6} lg={3} key={kpi.title}>
                                    <ExecutiveKPICard
                                        title={kpi.title}
                                        value={kpi.value}
                                        unit={kpi.unit}
                                        icon={kpi.icon}
                                        color={kpi.color}
                                        subtitle={kpi.subtitle}
                                        trend={kpi.trend}
                                        loading={isLoading}
                                        onClick={() => navigate(kpi.path)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Activity Section */}
                <Box sx={{ mb: 5 }}>
                    <SectionHeader
                        title="Activity & Notifications"
                        icon={<BarChartIcon />}
                        subtitle="Recent updates and notifications"
                    />

                    <Grid container spacing={3}>
                        {/* Notifications Widget */}
                        <Grid item xs={12} md={6} ref={notificationsRef}>
                            {showNotifications ? (
                                <Box 
                                    sx={{ 
                                        height: '100%',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <NotificationsWidget maxItems={5} loading={isLoadingActivity} />
                                </Box>
                            ) : (
                                <Paper
                                    sx={{
                                        height: 500,
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Loading notifications...
                                    </Typography>
                                </Paper>
                            )}
                        </Grid>

                        {/* Recent Activity */}
                        <Grid item xs={12} md={6} ref={activityRef}>
                            {showActivity ? (
                                <Box 
                                    sx={{ 
                                        height: '100%',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <RecentActivity activities={recentActivity} loading={isLoadingActivity} />
                                </Box>
                            ) : (
                                <Paper
                                    sx={{
                                        height: 500,
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Loading activity...
                                    </Typography>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </Box>

                {/* Analytics Charts Section */}
                <Box>
                    <SectionHeader
                        title="Analytics & Performance"
                        icon={<BarChartIcon />}
                        subtitle="Performance insights and data visualization"
                    />

                    {showCharts ? (
                        <Box ref={chartsRef}>
                            <RoleBasedWidgets kpis={charts} loading={isLoading} />
                        </Box>
                    ) : (
                        <Paper
                            sx={{
                                minHeight: 500,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                                p: 4,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Loading analytics...
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
