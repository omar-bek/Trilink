import { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

interface DeadlineCountdownProps {
  deadline: string | Date;
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isUrgent: boolean; // Less than 24 hours
}

export const DeadlineCountdown = ({ deadline, showIcon = true }: DeadlineCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isUrgent: false,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const difference = deadlineDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          isUrgent: false,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const totalHours = days * 24 + hours;
      const isUrgent = totalHours < 24;

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        isUrgent,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const getColor = (): 'default' | 'error' | 'warning' | 'success' => {
    if (timeRemaining.isExpired) return 'error';
    if (timeRemaining.isUrgent) return 'error';
    if (timeRemaining.days < 3) return 'warning';
    return 'default';
  };

  const formatTimeRemaining = (): string => {
    if (timeRemaining.isExpired) {
      return 'Expired';
    }

    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h`;
    }

    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }

    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && <AccessTime fontSize="small" />}
      <Chip
        label={formatTimeRemaining()}
        color={getColor()}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    </Box>
  );
};
