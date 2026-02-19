import { Card, CardContent, CardHeader, Typography, Box, List, ListItem, ListItemText, IconButton, Chip, Button } from '@mui/material';
import { Notifications as NotificationsIcon, CheckCircle, Error as ErrorIcon, Warning, Info, Close } from '@mui/icons-material';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification as NotificationType } from '@/services/notification.service';
import { useNavigate } from 'react-router-dom';
// Format timestamp helper (fallback if date-fns not available)
const formatTimestamp = (timestamp: string | Date) => {
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

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'success':
            return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
        case 'error':
            return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
        case 'warning':
            return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
        case 'info':
        default:
            return <Info sx={{ color: 'info.main', fontSize: 20 }} />;
    }
};

interface NotificationsWidgetProps {
    maxItems?: number;
    loading?: boolean;
}

export const NotificationsWidget = ({ maxItems = 5, loading = false }: NotificationsWidgetProps) => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        markAsRead,
        deleteNotification,
        markAllAsRead,
        isLoading,
    } = useNotifications({ limit: maxItems });

    const displayNotifications = notifications.slice(0, maxItems);
    const hasUnread = unreadCount > 0;

    if (loading || isLoading) {
        return (
            <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NotificationsIcon />
                            <Typography variant="h6">Notifications</Typography>
                        </Box>
                    }
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        Loading notifications...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

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
                        <NotificationsIcon sx={{ fontSize: 20, color: '#4682B4' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.01em' }}>
                            Notifications
                        </Typography>
                        {hasUnread && (
                            <Chip
                                label={unreadCount}
                                size="small"
                                color="error"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    animation: 'pulse 2s ease-in-out infinite',
                                    '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.7 },
                                    },
                                }}
                            />
                        )}
                    </Box>
                }
                sx={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    pb: 2,
                    pt: 2.5,
                    background: 'linear-gradient(180deg, rgba(70, 130, 180, 0.05) 0%, transparent 100%)',
                }}
                action={
                    hasUnread && (
                        <Button size="small" onClick={() => markAllAsRead()}>
                            Mark all read
                        </Button>
                    )
                }
            />
            <CardContent>
                {displayNotifications.length === 0 ? (
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
                            <NotificationsIcon sx={{ fontSize: 32, color: 'rgba(70, 130, 180, 0.5)' }} />
                        </Box>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontWeight: 500,
                                mb: 0.5,
                            }}
                        >
                            No notifications
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '0.8rem',
                            }}
                        >
                            You're all caught up!
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {displayNotifications.map((notification: NotificationType) => (
                            <ListItem
                                key={notification._id}
                                sx={{
                                    backgroundColor: notification.read
                                        ? 'transparent'
                                        : 'rgba(70, 130, 180, 0.1)',
                                    borderRadius: 1,
                                    mb: 1,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    },
                                }}
                                onClick={() => {
                                    if (!notification.read) {
                                        markAsRead(notification._id);
                                    }
                                    if (notification.actionUrl) {
                                        navigate(notification.actionUrl);
                                    }
                                }}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification._id);
                                        }}
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                    {getNotificationIcon(notification.type)}
                                </Box>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: notification.read ? 400 : 600 }}
                                            >
                                                {notification.title}
                                            </Typography>
                                            {!notification.read && (
                                                <Chip
                                                    label="New"
                                                    size="small"
                                                    sx={{
                                                        height: 16,
                                                        fontSize: '0.65rem',
                                                        backgroundColor: 'primary.main',
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
                                                    color="text.secondary"
                                                    sx={{ display: 'block', mt: 0.5 }}
                                                >
                                                    {notification.message}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {formatTimestamp(notification.createdAt)}
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
