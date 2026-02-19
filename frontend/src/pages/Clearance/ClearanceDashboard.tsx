import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Calculate as CalculateIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { PendingClearanceRFQs } from '@/components/Clearance/PendingClearanceRFQs';
import { DocumentationWorkspace } from '@/components/Clearance/DocumentationWorkspace';
import { HSCodePanel } from '@/components/Clearance/HSCodePanel';
import { DutyTaxEstimator } from '@/components/Clearance/DutyTaxEstimator';
import { ClearancePerformanceScore } from '@/components/Clearance/ClearancePerformanceScore';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const ClearanceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 1 }}>
          Customs Clearance Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#CBD5E1' }}>
          Manage clearance RFQs, review documentation, and track performance
        </Typography>
      </Box>

      {/* Performance Score Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <ClearancePerformanceScore />
        </Grid>
      </Grid>

      {/* Main Workspace Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(135, 206, 235, 0.2)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#CBD5E1',
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#87CEEB',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4682B4',
              },
            }}
          >
            <Tab
              icon={<AssignmentIcon />}
              iconPosition="start"
              label="Pending RFQs"
            />
            <Tab
              icon={<DescriptionIcon />}
              iconPosition="start"
              label="Documentation Review"
            />
            <Tab
              icon={<CodeIcon />}
              iconPosition="start"
              label="HS Code Assistant"
            />
            <Tab
              icon={<CalculateIcon />}
              iconPosition="start"
              label="Duty & Tax Estimator"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <PendingClearanceRFQs />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <DocumentationWorkspace />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <HSCodePanel />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <DutyTaxEstimator />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
