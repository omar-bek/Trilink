/**
 * Progressive Dashboard Loading
 * 
 * Priority-based rendering for optimal perceived performance
 * - Critical alerts: Immediate (0ms)
 * - KPIs: Above fold (100ms)
 * - Charts: Below fold, lazy loaded (500ms+)
 * 
 * Performance targets:
 * - First Contentful Paint: < 1s
 * - Largest Contentful Paint: < 2.5s
 * - Time to Interactive: < 3.5s
 */

import { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Button } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { ExecutiveKPICard } from './ExecutiveKPICard';
import { CriticalAlertsBanner } from './CriticalAlertsBanner';
import { RecentActivity } from './RecentActivity';
import { RoleBasedWidgets } from './RoleBasedWidgets';
import { NotificationsWidget } from './NotificationsWidget';
import { DashboardSkeleton } from '@/components/LoadingSkeleton/EnhancedSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { roleKPIConfigs, rolePrimaryActions } from '@/config/dashboardKPIs';
import { useNavigate } from 'react-router-dom';
import { RedesignedDashboard } from './RedesignedDashboard';

interface ProgressiveDashboardProps {
  dashboardData: any;
  recentActivity: any[];
  criticalAlerts: any[];
  isLoading: boolean;
  isLoadingActivity: boolean;
  isLoadingAlerts: boolean;
}

export const ProgressiveDashboard = ({
  dashboardData,
  recentActivity,
  criticalAlerts,
  isLoading,
  isLoadingActivity,
  isLoadingAlerts,
}: ProgressiveDashboardProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role as Role;

  // Progressive loading states
  const [showKPIs, setShowKPIs] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Intersection observers for below-fold content
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
    // KPIs: Load after 100ms (above fold)
    const kpiTimer = setTimeout(() => {
      setShowKPIs(true);
    }, 100);

    // Charts: Load when in view or after 500ms
    const chartsTimer = setTimeout(() => {
      if (chartsInView) {
        setShowCharts(true);
      }
    }, 500);

    // Activity: Load when in view or after 300ms
    const activityTimer = setTimeout(() => {
      if (activityInView) {
        setShowActivity(true);
      }
    }, 300);

    // Notifications: Load when in view or after 300ms
    const notificationsTimer = setTimeout(() => {
      if (notificationsInView) {
        setShowNotifications(true);
      }
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
    if (!isLoading && dashboardData) {
      setShowKPIs(true);
    }
  }, [isLoading, dashboardData]);

  useEffect(() => {
    if (!isLoadingActivity && recentActivity.length > 0) {
      setShowActivity(true);
    }
  }, [isLoadingActivity, recentActivity]);

  useEffect(() => {
    if (!isLoading && dashboardData?.charts) {
      setShowCharts(true);
    }
  }, [isLoading, dashboardData]);

  const kpis = dashboardData?.data?.kpis || dashboardData?.kpis;
  const charts = dashboardData?.data?.charts || dashboardData?.charts;

  // Get role-specific KPIs
  const executiveKPIs = useMemo(() => {
    if (!kpis) return [];
    
    const kpiConfigs = roleKPIConfigs[role] || roleKPIConfigs[Role.BUYER];

    return kpiConfigs.map((config) => {
      const value = kpis[config.valueKey as keyof typeof kpis] ?? 0;
      let formattedValue: string | number = value;

      // Format currency values
      if (config.unit === 'USD' || config.unit === 'AED') {
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: config.unit === 'USD' ? 'USD' : 'AED',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(value));
      } else if (config.unit === '%') {
        formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
      }

      // Get subtitle if available
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

      // Get trend if available
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

  const primaryAction = rolePrimaryActions[role] || rolePrimaryActions[Role.BUYER];

  // Use redesigned dashboard
  return (
    <RedesignedDashboard
      dashboardData={dashboardData}
      recentActivity={recentActivity}
      criticalAlerts={criticalAlerts}
      isLoading={isLoading}
      isLoadingActivity={isLoadingActivity}
      isLoadingAlerts={isLoadingAlerts}
    />
  );
};
