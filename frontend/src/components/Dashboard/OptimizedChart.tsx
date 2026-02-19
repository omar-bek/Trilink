/**
 * Optimized Chart Component
 * 
 * Performance optimizations for large datasets:
 * - Data sampling for > 1000 points
 * - Lazy rendering with intersection observer
 * - Memoized data transformations
 * - Reduced re-renders
 * 
 * Performance targets:
 * - Render time: < 100ms for 10K points
 * - Memory: < 20MB per chart
 * - FPS: 60fps during interactions
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, Box, Typography, Skeleton } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { designTokens } from '@/theme/designTokens';

const { colors } = designTokens;

interface OptimizedChartProps {
  title: string;
  type?: 'bar' | 'line' | 'pie';
  height?: number;
  loading?: boolean;
  data?: any;
  maxDataPoints?: number; // Maximum points before sampling
  enableLazyLoad?: boolean; // Lazy load when in viewport
}

const COLORS = [
  colors.intelligence.cerulean,
  colors.intelligence.azure,
  colors.semantic.success,
  colors.semantic.warning,
  colors.semantic.error,
  colors.intelligence.ceruleanLight,
  colors.intelligence.azureLight,
  colors.semantic.info,
];

// Data sampling for large datasets
const sampleData = <T extends { value: number }>(
  data: T[],
  maxPoints: number
): T[] => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: T[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Always include last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
};

// Format status names (e.g., "draft" -> "Draft", "pending_approval" -> "Pending Approval")
const formatStatusName = (name: string): string => {
  if (!name) return '';
  
  // Handle camelCase and snake_case
  return name
    .split(/[_\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format date labels (e.g., "Aug 2025" -> "Aug '25" or keep as is)
const formatDateLabel = (label: string): string => {
  if (!label) return '';
  
  // If it's already a date format like "Aug 2025", make it shorter
  const dateMatch = label.match(/(\w+)\s+(\d{4})/);
  if (dateMatch) {
    const [, month, year] = dateMatch;
    return `${month} '${year.slice(-2)}`;
  }
  
  return label;
};

// Sort data by value (descending) for better visualization
const sortDataByValue = (data: Array<{ name: string; value: number }>): Array<{ name: string; value: number }> => {
  return [...data].sort((a, b) => b.value - a.value);
};

// Transform data to chart format
const transformData = (rawData: any, shouldSort: boolean = false): Array<{ name: string; value: number }> => {
  if (!rawData) return [];

  let transformed: Array<{ name: string; value: number }> = [];

  // If it's already an array with label/value
  if (Array.isArray(rawData) && rawData.length > 0) {
    if (rawData[0].label && rawData[0].value !== undefined) {
      transformed = rawData.map((item) => ({
        name: formatStatusName(item.label || item.name || ''),
        value: item.value || 0,
      }));
    }
    // If it's array of objects with different structure
    else if (rawData[0].name || rawData[0].month || rawData[0].date) {
      transformed = rawData.map((item) => {
        const name = item.name || item.month || item.date || '';
        // Check if it's a date format
        const formattedName = name.match(/\d{4}/) ? formatDateLabel(name) : formatStatusName(name);
        return {
          name: formattedName,
          value: item.value || item.count || item.total || 0,
        };
      });
    }
  }
  // If it's an object with key-value pairs
  else if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    transformed = Object.entries(rawData)
      .map(([key, value]) => ({
        name: formatStatusName(key),
        value: typeof value === 'number' ? value : 0,
      }))
      .filter(item => item.value > 0); // Filter out zero values
  }

  // Sort by value if requested (useful for pie charts and bar charts)
  if (shouldSort && transformed.length > 0) {
    return sortDataByValue(transformed);
  }

  return transformed;
};

export const OptimizedChart = ({
  title,
  type = 'bar',
  height = 300,
  loading = false,
  data,
  maxDataPoints = 1000,
  enableLazyLoad = true,
}: OptimizedChartProps) => {
  const theme = useTheme();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [shouldRender, setShouldRender] = useState(!enableLazyLoad);

  // Lazy load when in viewport
  useEffect(() => {
    if (enableLazyLoad && inView && !shouldRender) {
      // Small delay to prevent blocking
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [inView, enableLazyLoad, shouldRender]);

  // Memoized data transformation with sampling
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Sort data for pie and bar charts for better visualization
    const shouldSort = type === 'pie' || type === 'bar';
    const transformed = transformData(data, shouldSort);
    
    // Sample data if too large
    if (transformed.length > maxDataPoints) {
      return sampleData(transformed, maxDataPoints);
    }
    
    return transformed;
  }, [data, maxDataPoints, type]);

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width="100%" height={height - 40} />
        </Box>
      );
    }

    if (!shouldRender) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Loading chart...
          </Typography>
        </Box>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.05) 0%, rgba(70, 130, 180, 0.02) 100%)',
            border: '1px dashed rgba(70, 130, 180, 0.3)',
            borderRadius: 3,
            color: 'text.secondary',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(70, 130, 180, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <BarChartIcon 
              sx={{ 
                fontSize: 48, 
                color: 'rgba(70, 130, 180, 0.4)',
                opacity: 0.6,
              }} 
            />
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              No data available
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.8rem',
                textAlign: 'center',
                maxWidth: '200px',
              }}
            >
              Data will appear here once available
            </Typography>
          </Box>
        </Box>
      );
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={chartData} 
              margin={{ top: 25, right: 30, left: 25, bottom: chartData.length > 5 ? 80 : 50 }}
              barCategoryGap="15%"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={colors.base.neutral700} 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.8rem', fontWeight: 500 }}
                tick={{ fill: colors.base.neutral300 }}
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 50}
                interval={0}
                tickLine={{ stroke: colors.base.neutral600 }}
              />
              <YAxis
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem', fontWeight: 500 }}
                tick={{ fill: colors.base.neutral300 }}
                tickLine={{ stroke: colors.base.neutral600 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ 
                  color: colors.base.neutral200,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
                cursor={{ fill: 'rgba(70, 130, 180, 0.1)' }}
              />
              <Legend
                wrapperStyle={{ 
                  fontSize: '0.85rem', 
                  color: colors.base.neutral300,
                  paddingTop: '20px',
                  fontWeight: 500,
                }}
                iconType="square"
                iconSize={12}
                formatter={(value: string) => formatStatusName(value)}
              />
              <Bar 
                dataKey="value" 
                fill={colors.intelligence.cerulean} 
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart 
              data={chartData} 
              margin={{ top: 25, right: 30, left: 25, bottom: chartData.length > 5 ? 80 : 50 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={colors.base.neutral700} 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.8rem', fontWeight: 500 }}
                tick={{ fill: colors.base.neutral300 }}
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 50}
                interval={0}
                tickLine={{ stroke: colors.base.neutral600 }}
              />
              <YAxis
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem', fontWeight: 500 }}
                tick={{ fill: colors.base.neutral300 }}
                tickLine={{ stroke: colors.base.neutral600 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ 
                  color: colors.base.neutral200,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(value);
                  }
                  return value;
                }}
                cursor={{ stroke: colors.intelligence.cerulean, strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend
                wrapperStyle={{ 
                  fontSize: '0.85rem', 
                  color: colors.base.neutral300,
                  paddingTop: '20px',
                  fontWeight: 500,
                }}
                iconType="line"
                iconSize={14}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.intelligence.cerulean}
                strokeWidth={3}
                dot={{ 
                  fill: colors.intelligence.cerulean, 
                  r: 5,
                  strokeWidth: 2,
                  stroke: colors.base.blackPearlLight,
                }}
                activeDot={{ 
                  r: 7,
                  strokeWidth: 2,
                  stroke: colors.base.blackPearlLight,
                  fill: colors.intelligence.cerulean,
                }}
                isAnimationActive={chartData.length < 100}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ name, percent, value }) => {
                  if (chartData.length > 8) return '';
                  const percentage = (percent * 100).toFixed(1);
                  return `${name}\n${percentage}% (${value})`;
                }}
                outerRadius={chartData.length <= 5 ? 110 : 90}
                innerRadius={chartData.length <= 5 ? 40 : 30}
                fill={colors.intelligence.cerulean}
                dataKey="value"
                isAnimationActive={chartData.length < 50}
                animationDuration={800}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ 
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                      stroke: colors.base.blackPearlLight,
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ 
                  color: colors.base.neutral200,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
                formatter={(value: any) => {
                  const total = chartData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return [`${value} (${percentage}%)`, 'Count'];
                }}
              />
              <Legend
                wrapperStyle={{ 
                  fontSize: '0.85rem', 
                  color: colors.base.neutral300,
                  paddingTop: '20px',
                  fontWeight: 500,
                }}
                iconType="circle"
                iconSize={12}
                formatter={(value: string) => formatStatusName(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box
            sx={{
              height,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Chart type not supported
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card 
      ref={ref}
      sx={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, rgba(70, 130, 180, 0.6) 0%, rgba(70, 130, 180, 0.2) 100%)',
          zIndex: 1,
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)',
          borderColor: 'rgba(70, 130, 180, 0.3)',
        },
      }}
    >
      <CardHeader 
        title={
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#FFFFFF',
              fontSize: '1.1rem',
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </Typography>
        }
        sx={{
          pb: 1.5,
          pt: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(180deg, rgba(70, 130, 180, 0.05) 0%, transparent 100%)',
        }}
      />
      <CardContent sx={{ pt: 2.5, pb: 2.5 }}>
        <Box sx={{ width: '100%', height }}>{renderChart()}</Box>
      </CardContent>
    </Card>
  );
};
