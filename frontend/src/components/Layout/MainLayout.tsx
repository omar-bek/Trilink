import { ReactNode, useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { getNavigationItems, NavigationItem } from '@/config/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs';
import { UAEGovernmentFlag, UAEGovernmentBadge } from '@/components/GovernmentBranding';
import { GovernmentComplianceFooter } from '@/components/GovernmentBranding/GovernmentComplianceFooter';
import { NotificationPanel, Notification as NotificationType } from '@/components/DesignSystem';
import { useNotifications } from '@/hooks/useNotifications';
import { usePublicSettings } from '@/hooks/useSettings';
// import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 280;
const TOPBAR_HEIGHT = 64;

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { data: settingsData } = usePublicSettings();
  const settings = settingsData?.data;
  
  const siteName = settings?.siteName || 'TriLink';
  const siteDescription = settings?.siteDescription;

  // Fetch notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications({ limit: 20 });

  // Get filtered navigation items based on user role
  // Handle null user gracefully - return empty array instead of crashing
  const navigationItems = useMemo(() => {
    if (!user || !user.role) return [];
    try {
      return getNavigationItems(user.role as Role);
    } catch (error) {
      // Navigation config error should not crash the layout
      if (import.meta.env.DEV) {
        console.warn('Navigation items error:', error);
      }
      return [];
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (location.pathname === item.path) return true;
    if (location.pathname.startsWith(item.path + '/')) return true;
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  const renderNavItem = (item: NavigationItem, level: number = 0) => {
    if (item.divider) {
      return <Divider key={item.id} sx={{ my: 1 }} />;
    }

    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <Box key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive && !hasChildren}
            onClick={() => {
              if (hasChildren) {
                toggleExpand(item.id);
              } else {
                handleNavigation(item.path);
              }
            }}
            onKeyDown={(e) => {
              if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                toggleExpand(item.id);
              }
            }}
            aria-label={hasChildren ? `${item.label}, ${isExpanded ? 'expanded' : 'collapsed'}` : item.label}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-current={isActive && !hasChildren ? 'page' : undefined}
            role={hasChildren ? 'button' : 'link'}
            tabIndex={0}
            sx={{
              pl: 2 + level * 2,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              transition: 'background-color 0.2s ease-in-out',
              color: '#CBD5E1',
              '&.Mui-selected': {
                backgroundColor: 'rgba(70, 130, 180, 0.2)',
                color: '#87CEEB',
                borderLeft: '3px solid #4682B4',
                '&:hover': {
                  backgroundColor: 'rgba(70, 130, 180, 0.3)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#87CEEB',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(135, 206, 235, 0.1)',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: '#4682B4',
                outlineOffset: '2px',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? 'inherit' : 'inherit',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              }
            />
            {hasChildren && (
              <Box
                component="span"
                aria-hidden="true"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          minHeight: `${TOPBAR_HEIGHT}px !important`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UAEGovernmentFlag size="medium" variant="minimal" />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
            {siteName}
          </Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <UAEGovernmentBadge variant="official" size="small" label={siteDescription} />
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List>
          {navigationItems.map((item) => renderNavItem(item))}
        </List>
      </Box>
      {user && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user.firstName?.[0] || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#CBD5E1' }} noWrap>
                  {user.role}
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  const currentPageTitle = useMemo(() => {
    try {
      const item = navigationItems
        .flatMap((item) => [item, ...(item.children || [])])
        .find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
      return item?.label || 'TriLink';
    } catch (error) {
      // Title resolution error should not crash
      if (import.meta.env.DEV) {
        console.warn('Page title error:', error);
      }
      return 'TriLink';
    }
  }, [location.pathname, navigationItems]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: TOPBAR_HEIGHT,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Toolbar 
          sx={{ 
            height: TOPBAR_HEIGHT, 
            minHeight: `${TOPBAR_HEIGHT}px !important`,
            px: { xs: 2, sm: 3 },
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: '#F1F5F9',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                color: '#F1F5F9',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                letterSpacing: '0.5px',
              }}
            >
              {currentPageTitle}
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <UAEGovernmentFlag size="small" variant="minimal" />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#94A3B8', 
                  fontWeight: 500, 
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                }}
              >
                UAE
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Notifications */}
            {notifications && notifications.length >= 0 && (
              <NotificationPanel
                notifications={notifications.map((n) => ({
                  id: (n as any)._id || (n as any).id || String(Math.random()),
                  title: n.title || 'Notification',
                  message: n.message || '',
                  type: (n.type as 'success' | 'error' | 'warning' | 'info') || 'info',
                  timestamp: n.createdAt || new Date().toISOString(),
                  read: n.read || false,
                  action: n.actionUrl
                    ? {
                        label: 'View',
                        onClick: () => {
                          if (n.actionUrl) {
                            navigate(n.actionUrl);
                          }
                        },
                      }
                    : undefined,
                }))}
                onMarkAsRead={(id) => {
                  if (markAsRead) {
                    markAsRead(id);
                  }
                }}
                onMarkAllAsRead={() => {
                  if (markAllAsRead) {
                    markAllAsRead();
                  }
                }}
                onDelete={(id) => {
                  if (deleteNotification) {
                    deleteNotification(id);
                  }
                }}
                onClearAll={() => {
                  if (deleteAllNotifications) {
                    deleteAllNotifications();
                  }
                }}
              />
            )}
            {/* User Menu */}
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-label="User account menu"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
              aria-controls={anchorEl ? 'user-menu' : undefined}
              sx={{
                border: '2px solid',
                borderColor: 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  bgcolor: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                },
              }}
              MenuListProps={{
                'aria-labelledby': 'user-menu-button',
              }}
            >
              {user && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#F1F5F9' }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    {user.email}
                  </Typography>
                </Box>
              )}
              <MenuItem 
                onClick={() => {
                  navigate('/profile');
                  handleMenuClose();
                }}
                sx={{
                  color: '#F1F5F9',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <AccountCircle fontSize="small" sx={{ color: '#94A3B8' }} />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem 
                onClick={() => {
                  navigate('/settings');
                  handleMenuClose();
                }}
                sx={{
                  color: '#F1F5F9',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <Settings fontSize="small" sx={{ color: '#94A3B8' }} />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  color: '#F87171',
                  '&:hover': {
                    bgcolor: 'rgba(248, 113, 113, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: '#F87171' }} />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: `${TOPBAR_HEIGHT}px`,
          backgroundColor: '#0F172A', // Dark blue background
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          color: '#F1F5F9',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Breadcrumbs />
          {children}
        </Box>
        <GovernmentComplianceFooter />
      </Box>
    </Box>
  );
};
