import { Card, CardContent, CardHeader, Box, Typography, Skeleton } from '@mui/material';
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

interface ChartPlaceholderProps {
  title: string;
  type?: 'bar' | 'line' | 'pie';
  height?: number;
  loading?: boolean;
  data?: any;
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

export const ChartPlaceholder = ({
  title,
  type = 'bar',
  height = 300,
  loading = false,
  data,
}: ChartPlaceholderProps) => {
  const theme = useTheme();

  // Transform data to chart format
  const transformData = (rawData: any) => {
    if (!rawData) return [];

    // If it's already an array with label/value
    if (Array.isArray(rawData) && rawData.length > 0) {
      if (rawData[0].label && rawData[0].value !== undefined) {
        return rawData.map((item) => ({
          name: item.label || item.name || '',
          value: item.value || 0,
        }));
      }
      // If it's array of objects with different structure
      if (rawData[0].name || rawData[0].month || rawData[0].date) {
        return rawData.map((item) => ({
          name: item.name || item.month || item.date || '',
          value: item.value || item.count || item.total || 0,
        }));
      }
    }

    // If it's an object with key-value pairs
    if (typeof rawData === 'object' && !Array.isArray(rawData)) {
      return Object.entries(rawData).map(([key, value]) => ({
        name: key,
        value: typeof value === 'number' ? value : 0,
      }));
    }

    return [];
  };

  const chartData = transformData(data);

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width="100%" height={height - 40} />
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
            bgcolor: 'background.paper',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No data available
          </Typography>
        </Box>
      );
    }

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
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <Box sx={{ width: '100%', height }}>{renderChart()}</Box>
      </CardContent>
    </Card>
  );
};
