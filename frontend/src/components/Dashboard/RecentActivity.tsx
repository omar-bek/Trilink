import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  ShoppingCart as PurchaseRequestIcon,
  Assignment as RFQIcon,
  Gavel as BidIcon,
  AccountBalance as ContractIcon,
  LocalShipping as ShipmentIcon,
  Payment as PaymentIcon,
  Gavel as DisputeIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { formatDateTime } from '@/utils';
import { RecentActivity as RecentActivityType } from '@/services/dashboard.service';

interface RecentActivityProps {
  activities: RecentActivityType[];
  loading?: boolean;
  maxItems?: number;
}

const getActivityIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    purchase_request: <PurchaseRequestIcon />,
    rfq: <RFQIcon />,
    bid: <BidIcon />,
    contract: <ContractIcon />,
    shipment: <ShipmentIcon />,
    payment: <PaymentIcon />,
    dispute: <DisputeIcon />,
  };
  return iconMap[type.toLowerCase()] || <PurchaseRequestIcon />;
};

const getStatusColor = (status?: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
  if (!status) return 'default';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('completed') || statusLower.includes('approved')) return 'success';
  if (statusLower.includes('pending') || statusLower.includes('in_progress')) return 'warning';
  if (statusLower.includes('rejected') || statusLower.includes('cancelled')) return 'error';
  return 'default';
};

export const RecentActivity = ({ activities, loading = false, maxItems = 10 }: RecentActivityProps) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card
      sx={{
        height: '100%',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon sx={{ fontSize: 20, color: '#4682B4' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              Recent Activity
            </Typography>
          </Box>
        }
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2,
          pt: 2.5,
          background: 'linear-gradient(180deg, rgba(70, 130, 180, 0.05) 0%, transparent 100%)',
        }}
      />
      <CardContent>
        {loading ? (
          <List>
            {[...Array(5)].map((_, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        ) : displayActivities.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 5,
              px: 2,
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.15) 0%, rgba(70, 130, 180, 0.05) 100%)',
                mb: 2,
              }}
            >
              <TimelineIcon sx={{ fontSize: 32, color: 'rgba(70, 130, 180, 0.5)' }} />
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              No recent activity
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.8rem',
              }}
            >
              Activity will appear here as it happens
            </Typography>
          </Box>
        ) : (
          <List>
            {displayActivities.map((activity) => (
              <ListItem
                key={activity.id}
                sx={{
                  borderLeft: '3px solid',
                  borderColor: '#4682B4',
                  mb: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  py: 1.5,
                  px: 2,
                  transition: 'background-color 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 65, 85, 0.7)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{getActivityIcon(activity.type)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.title}
                      </Typography>
                      {activity.status && (
                        <Chip
                          label={activity.status}
                          size="small"
                          color={getStatusColor(activity.status)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {formatDateTime(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
