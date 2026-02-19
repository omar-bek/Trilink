import { Box, Skeleton } from '@mui/material';
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
import { designTokens } from '@/theme/designTokens';

const { colors } = designTokens;

interface AnalyticsChartProps {
  title?: string;
  type: 'bar' | 'line' | 'pie';
  data?: Array<{ label: string; value: number; [key: string]: any }>;
  loading?: boolean;
  height?: number;
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

export const AnalyticsChart = ({
  type,
  data = [],
  loading = false,
  height = 300,
}: AnalyticsChartProps) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton variant="rectangular" width="100%" height={height - 40} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        No data available
      </Box>
    );
  }

  // Format data for recharts
  const chartData = data.map((item) => ({
    name: item.label || item.name || '',
    value: item.value || 0,
    ...item,
  }));

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.base.neutral700} />
              <XAxis
                dataKey="name"
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem' }}
                tick={{ fill: colors.base.neutral300 }}
              />
              <YAxis
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem' }}
                tick={{ fill: colors.base.neutral300 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                }}
                labelStyle={{ color: colors.base.neutral200 }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', color: colors.base.neutral300 }}
                iconType="square"
              />
              <Bar dataKey="value" fill={colors.intelligence.cerulean} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.base.neutral700} />
              <XAxis
                dataKey="name"
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem' }}
                tick={{ fill: colors.base.neutral300 }}
              />
              <YAxis
                stroke={colors.base.neutral300}
                style={{ fontSize: '0.75rem' }}
                tick={{ fill: colors.base.neutral300 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                }}
                labelStyle={{ color: colors.base.neutral200 }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', color: colors.base.neutral300 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.intelligence.cerulean}
                strokeWidth={2}
                dot={{ fill: colors.intelligence.cerulean, r: 4 }}
                activeDot={{ r: 6 }}
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
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill={colors.intelligence.cerulean}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.base.blackPearlLight,
                  border: `1px solid ${colors.base.neutral700}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: colors.base.neutral200,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', color: colors.base.neutral300 }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return <Box sx={{ width: '100%', height }}>{renderChart()}</Box>;
};
