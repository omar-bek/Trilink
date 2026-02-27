import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Factory,
  LocalShipping,
  CheckCircle,
  Cancel,
  Warehouse,
  Gavel,
  Description,
  Warning,
  Upload,
  Visibility,
} from '@mui/icons-material';
import { Shipment, ShipmentStatus, CustomsClearanceStatus } from '@/types/shipment';
import { formatDateTime } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

interface ShipmentTimelineProps {
  shipment: Shipment;
}

const statusIcons = {
  [ShipmentStatus.IN_PRODUCTION]: Factory,
  [ShipmentStatus.READY_FOR_PICKUP]: Warehouse,
  [ShipmentStatus.IN_TRANSIT]: LocalShipping,
  [ShipmentStatus.IN_CLEARANCE]: Gavel,
  [ShipmentStatus.DELIVERED]: CheckCircle,
  [ShipmentStatus.CANCELLED]: Cancel,
};

const statusLabels = {
  [ShipmentStatus.IN_PRODUCTION]: 'In Production',
  [ShipmentStatus.READY_FOR_PICKUP]: 'Ready for Pickup',
  [ShipmentStatus.IN_TRANSIT]: 'In Transit',
  [ShipmentStatus.IN_CLEARANCE]: 'In Clearance',
  [ShipmentStatus.DELIVERED]: 'Delivered',
  [ShipmentStatus.CANCELLED]: 'Cancelled',
};

export const ShipmentTimeline = ({ shipment }: ShipmentTimelineProps) => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const isGovernment = role === Role.GOVERNMENT || role === Role.CLEARANCE || role === Role.ADMIN;
  const isSupplier = role === Role.SUPPLIER;

  const getStatusIndex = (status: ShipmentStatus): number => {
    const statuses = Object.values(ShipmentStatus);
    return statuses.indexOf(status);
  };

  const currentStatusIndex = getStatusIndex(shipment.status);
  const isCancelled = shipment.status === ShipmentStatus.CANCELLED;

  // Create timeline items from tracking events
  const trackingItems = shipment.trackingEvents
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((event, index) => {
      const StatusIcon = statusIcons[event.status] || LocalShipping;
      const isCurrentStatus = event.status === shipment.status && index === 0;
      const isCompleted = getStatusIndex(event.status) < currentStatusIndex;

      return {
        key: `tracking-${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        type: 'tracking' as const,
        icon: StatusIcon,
        title: statusLabels[event.status],
        description: event.description,
        location: event.location,
        color: isCancelled
          ? 'error'
          : isCurrentStatus
            ? 'primary'
            : isCompleted
              ? 'success'
              : 'grey',
      };
    });

  // Add customs clearance events to timeline
  const customsItems =
    shipment.customsClearanceEvents?.map((event, index) => {
      let icon = Description;
      let color: 'success' | 'warning' | 'error' | 'info' | 'grey' = 'info';

      switch (event.status) {
        case CustomsClearanceStatus.APPROVED:
          icon = CheckCircle;
          color = 'success';
          break;
        case CustomsClearanceStatus.REJECTED:
          icon = Cancel;
          color = 'error';
          break;
        case CustomsClearanceStatus.UNDER_REVIEW:
        case CustomsClearanceStatus.DOCUMENTS_SUBMITTED:
          icon = Gavel;
          color = 'warning';
          break;
        case CustomsClearanceStatus.RESUBMITTED:
          icon = Warning;
          color = 'info';
          break;
        default:
          icon = Description;
          color = 'grey';
      }

      return {
        key: `customs-${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        type: 'customs' as const,
        icon,
        title: `Customs: ${event.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
        description: event.description,
        rejectionReason: event.rejectionReason,
        customsAuthority: event.customsAuthority,
        color: color as 'primary' | 'secondary' | 'inherit' | 'grey' | 'error' | 'warning' | 'info' | 'success',
        status: event.status,
      };
    }) || [];

  // Combine and sort all events
  const allEvents = [...trackingItems, ...customsItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const timelineItems = allEvents.map((event, index) => {
    const EventIcon = event.icon;

    return (
      <TimelineItem key={event.key}>
        <TimelineOppositeContent sx={{ flex: 0.3 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(event.timestamp)}
          </Typography>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color={event.color as 'primary' | 'secondary' | 'inherit' | 'grey' | 'error' | 'warning' | 'info' | 'success'}>
            <EventIcon fontSize="small" />
          </TimelineDot>
          {index < allEvents.length - 1 && <TimelineConnector />}
        </TimelineSeparator>
        <TimelineContent>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {event.title}
              </Typography>
              {event.type === 'customs' && event.customsAuthority && (
                <Chip label={event.customsAuthority} size="small" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {event.description}
            </Typography>
            {event.type === 'tracking' && event.location && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                📍 {event.location.address}
              </Typography>
            )}
            {event.type === 'customs' && event.rejectionReason && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Rejection Reason:
                </Typography>
                <Typography variant="body2">{event.rejectionReason}</Typography>
              </Box>
            )}
            {/* Customs Action Buttons */}
            {event.type === 'customs' && index === 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Actions:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {isSupplier && (
                    event.status === CustomsClearanceStatus.PENDING ||
                    event.status === CustomsClearanceStatus.REJECTED ||
                    event.status === CustomsClearanceStatus.NOT_REQUIRED
                  ) && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Upload />}
                      onClick={() => {
                        // Scroll to customs clearance section or open dialog
                        const customsSection = document.getElementById('customs-clearance-section');
                        if (customsSection) {
                          customsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    >
                      Submit Documents
                    </Button>
                  )}
                  {isGovernment && (
                    event.status === CustomsClearanceStatus.DOCUMENTS_SUBMITTED ||
                    event.status === CustomsClearanceStatus.UNDER_REVIEW
                  ) && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          const customsSection = document.getElementById('customs-clearance-section');
                          if (customsSection) {
                            customsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => {
                          const customsSection = document.getElementById('customs-clearance-section');
                          if (customsSection) {
                            customsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Visibility />}
                    onClick={() => {
                      const customsSection = document.getElementById('customs-clearance-section');
                      if (customsSection) {
                        customsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </TimelineContent>
      </TimelineItem>
    );
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Tracking & Customs Timeline
      </Typography>
      {timelineItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No events yet.
        </Typography>
      ) : (
        <Timeline>{timelineItems}</Timeline>
      )}
    </Box>
  );
};
