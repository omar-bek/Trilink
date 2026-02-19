import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Menu,
  Divider,
  Button,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
} from '@mui/icons-material';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  timestamp: Date | string;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  maxHeight?: string | number;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    case 'warning':
      return <Warning sx={{ color: 'warning.main' }} />;
    case 'info':
      return <Info sx={{ color: 'info.main' }} />;
  }
};

const formatTimestamp = (timestamp: Date | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  maxHeight = '500px',
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <>
      <IconButton 
        onClick={handleClick} 
        sx={{ 
          position: 'relative',
          color: '#F1F5F9',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            transform: 'scale(1.1)',
          },
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Badge 
          badgeContent={unreadCount > 0 ? unreadCount : undefined} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            },
          }}
        >
          <NotificationsIcon sx={{ fontSize: 24 }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: '420px',
            maxWidth: '90vw',
            maxHeight,
            mt: 1.5,
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box 
          sx={{ 
            p: 2.5, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F1F5F9' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button 
                size="small" 
                onClick={onMarkAllAsRead}
                sx={{ 
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                Mark all read
              </Button>
            )}
            {onClearAll && notifications.length > 0 && (
              <Button 
                size="small" 
                onClick={onClearAll}
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                  },
                }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        <Box sx={{ overflow: 'auto', maxHeight: 'calc(100% - 120px)' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                No notifications
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                You're all caught up!
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read
                        ? 'transparent'
                        : 'rgba(25, 118, 210, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      borderLeft: notification.read ? 'none' : '3px solid',
                      borderColor: notification.read ? 'transparent' : 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: notification.read 
                            ? 'rgba(148, 163, 184, 0.1)' 
                            : `${theme.palette[notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'].main}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={notification.read ? 500 : 700}
                            sx={{ color: '#F1F5F9' }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip
                              label="New"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'primary.main',
                                color: '#FFFFFF',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {notification.message && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mt: 0.5,
                                color: '#94A3B8',
                                lineHeight: 1.5,
                              }}
                            >
                              {notification.message}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#64748B',
                                fontSize: '0.7rem',
                              }}
                            >
                              {formatTimestamp(notification.timestamp)}
                            </Typography>
                            {notification.action && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClose();
                                  notification.action?.onClick();
                                }}
                                sx={{ 
                                  mt: 0.5,
                                  fontSize: '0.7rem',
                                  py: 0.25,
                                  px: 1,
                                  minWidth: 'auto',
                                  height: 24,
                                  textTransform: 'none',
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                  '&:hover': {
                                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                                    borderColor: 'primary.light',
                                  },
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {onDelete && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                          }}
                          sx={{ 
                            color: '#94A3B8',
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Menu>
    </>
  );
};
