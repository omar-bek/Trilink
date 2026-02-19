import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date | string;
  sender: 'user' | 'other';
  senderName?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface AnonymousChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, attachments?: File[]) => void;
  currentUserName?: string;
  otherUserName?: string;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: string | number;
}

export const AnonymousChat: React.FC<AnonymousChatProps> = ({
  messages,
  onSendMessage,
  currentUserName = 'You',
  otherUserName = 'Anonymous User',
  placeholder = 'Type a message...',
  disabled = false,
  maxHeight = '500px',
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {msg.sender === 'other' && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              )}

              <Box
                sx={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor:
                      msg.sender === 'user'
                        ? theme.palette.primary.main
                        : theme.palette.background.default,
                    border:
                      msg.sender === 'other'
                        ? `1px solid ${theme.palette.divider}`
                        : 'none',
                  }}
                >
                  {msg.senderName && msg.sender === 'other' && (
                    <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                      {msg.senderName}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: msg.sender === 'user' ? '#FFFFFF' : theme.palette.text.primary,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.message}
                  </Typography>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {msg.attachments.map((attachment, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            borderRadius: theme.shape.borderRadius,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Typography variant="caption">{attachment.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                  {formatTimestamp(msg.timestamp)}
                </Typography>
              </Box>

              {msg.sender === 'user' && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.secondary.main,
                  }}
                >
                  {currentUserName.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {attachments.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                p: 0.5,
                borderRadius: theme.shape.borderRadius,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeAttachment(index)}
                sx={{ width: 20, height: 20 }}
              >
                <Typography variant="caption">×</Typography>
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          size="small"
        >
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.default,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          color="primary"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};
