/**
 * Negotiation Room Component
 * 
 * Real-time negotiation interface for service providers
 */

import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Avatar, Divider } from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common';
import { ServiceType, ServiceTypeConfig } from '@/config/serviceProvider';
import { designTokens } from '@/theme/designTokens';
import { useQuery } from '@tanstack/react-query';
import { bidService } from '@/services/bid.service';
import { queryKeys } from '@/lib/queryKeys';

const { spacing, colors } = designTokens;

interface NegotiationRoomProps {
  serviceType: ServiceType;
  serviceConfig: ServiceTypeConfig;
  bidId?: string;
  contractId?: string;
}

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export const NegotiationRoom = ({ serviceType, serviceConfig, bidId, contractId }: NegotiationRoomProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch negotiation data
  const { data: negotiationData, isLoading } = useQuery({
    queryKey: queryKeys.bids.detail(bidId || ''),
    queryFn: () => bidService.getBid(bidId || ''),
    enabled: !!bidId && serviceConfig.workflow.hasNegotiation,
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      senderRole: 'Service Provider',
      message: message.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');
    // TODO: Send to backend via WebSocket or API
  };

  return (
    <EnterpriseCard
      title={`Negotiation Room - ${serviceConfig.displayName}`}
      subtitle={bidId ? `Bid: ${bidId}` : contractId ? `Contract: ${contractId}` : 'Active negotiations'}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.lg,
            backgroundColor: colors.base.blackPearl,
            borderRadius: designTokens.borders.radius.md,
            mb: spacing.lg,
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: spacing.xxxl }}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the negotiation by sending a message.
              </Typography>
            </Box>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  gap: spacing.md,
                  mb: spacing.lg,
                  flexDirection: msg.sender === 'You' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar sx={{ bgcolor: colors.intelligence.cerulean }}>
                  {msg.sender[0]}
                </Avatar>
                <Paper
                  sx={{
                    flex: 1,
                    padding: spacing.md,
                    backgroundColor:
                      msg.sender === 'You'
                        ? colors.intelligence.ceruleanDark
                        : colors.base.blackPearlLight,
                    borderRadius: designTokens.borders.radius.md,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: spacing.xs }}>
                    <Typography variant="body2" fontWeight={600}>
                      {msg.sender}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{msg.message}</Typography>
                </Paper>
              </Box>
            ))}
          )}
        </Box>

        <Divider sx={{ my: spacing.lg }} />

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AttachFile />}
            sx={{ minWidth: 'auto' }}
          >
            Attach
          </Button>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            Send
          </Button>
        </Box>
      </Box>
    </EnterpriseCard>
  );
};