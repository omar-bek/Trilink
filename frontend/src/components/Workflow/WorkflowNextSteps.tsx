import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Divider,
} from '@mui/material';
import {
    ArrowForward,
    CheckCircle,
    Assignment,
    Gavel,
    Description,
    AttachMoney,
    LocalShipping,
    Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface NextStep {
    id: string;
    title: string;
    description: string;
    action: {
        label: string;
        path?: string;
        onClick?: () => void;
        variant?: 'contained' | 'outlined' | 'text';
    };
    icon?: React.ReactNode;
    required?: boolean;
}

interface WorkflowNextStepsProps {
    title?: string;
    steps: NextStep[];
    completed?: boolean;
    completedMessage?: string;
}

export const WorkflowNextSteps = ({
    title = "What's Next?",
    steps,
    completed = false,
    completedMessage = "All steps completed!",
}: WorkflowNextStepsProps) => {
    const navigate = useNavigate();

    if (completed) {
        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {completedMessage}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This workflow step is complete. You can view related items below.
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (steps.length === 0) {
        return null;
    }

    return (
        <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ArrowForward color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Complete these steps to continue the procurement workflow:
                </Typography>
                <List sx={{ p: 0 }}>
                    {steps.map((step, index) => (
                        <Box key={step.id}>
                            <ListItem
                                sx={{
                                    px: 0,
                                    py: 1.5,
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        borderRadius: 1,
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {step.icon || (
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                backgroundColor: 'primary.light',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'primary.main',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {step.title}
                                            </Typography>
                                            {step.required && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                        backgroundColor: 'error.light',
                                                        color: 'error.main',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Required
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {step.description}
                                        </Typography>
                                    }
                                />
                                <Button
                                    variant={step.action.variant || 'contained'}
                                    size="small"
                                    endIcon={<ArrowForward />}
                                    onClick={() => {
                                        if (step.action.onClick) {
                                            step.action.onClick();
                                        } else if (step.action.path) {
                                            navigate(step.action.path);
                                        }
                                    }}
                                    sx={{ ml: 2 }}
                                >
                                    {step.action.label}
                                </Button>
                            </ListItem>
                            {index < steps.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

// Predefined icon components for common workflow steps
export const WorkflowIcons = {
    RFQ: <Assignment color="primary" />,
    Contract: <Description color="primary" />,
    Bid: <Gavel color="primary" />,
    Payment: <AttachMoney color="primary" />,
    Shipment: <LocalShipping color="primary" />,
    View: <Visibility color="primary" />,
};
