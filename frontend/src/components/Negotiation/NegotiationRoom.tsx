import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Translate,
  Lock,
  Person,
  CloudUpload,
  Description,
  Download,
  Delete,
} from '@mui/icons-material';
import { formatDateTime } from '@/utils';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  translatedMessage?: string;
  timestamp: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  size: number;
  type: string;
}

interface NegotiationRoomProps {
  bidId: string;
  onClose?: () => void;
}

export const NegotiationRoom = ({ bidId, onClose }: NegotiationRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate loading messages
    setMessages([
      {
        id: '1',
        senderId: 'buyer',
        senderName: 'Buyer',
        message: 'Thank you for your bid. We would like to discuss the delivery timeline.',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        senderId: 'supplier',
        senderName: 'You',
        message: 'We can deliver within 30 days. Would you like to discuss payment terms?',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [bidId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'supplier',
      senderName: 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    // TODO: Send message to API
  };

  const handleTranslate = async (messageId: string) => {
    setIsTranslating(true);
    // TODO: Call translation API
    setTimeout(() => {
      setShowTranslation(true);
      setIsTranslating(false);
    }, 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const document: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        uploadedBy: 'You',
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
      };

      setDocuments([...documents, document]);
      // TODO: Upload file to API
    });
  };

  const handleDownloadDocument = (document: Document) => {
    // TODO: Implement download
    window.open(document.url, '_blank');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock fontSize="small" />
            Anonymous Negotiation Room
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secure communication • Identity protected • AI Translation enabled
          </Typography>
        </Box>
        {onClose && (
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Privacy Notice:</strong> Your identity is protected. The buyer cannot see your company name or personal information.
          All communications are encrypted and secure.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Chat Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Chat" />
                <Tab label="Documents" />
              </Tabs>

              {activeTab === 0 && (
                <>
                  {/* Messages */}
                  <Box
                    sx={{
                      height: '500px',
                      overflowY: 'auto',
                      mb: 2,
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                    }}
                  >
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.senderId === 'supplier' ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            maxWidth: '70%',
                            bgcolor: message.senderId === 'supplier' ? 'primary.main' : 'background.paper',
                            color: message.senderId === 'supplier' ? 'white' : 'text.primary',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'action.active' }}>
                              <Person fontSize="small" />
                            </Avatar>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {message.senderName}
                            </Typography>
                            <Chip
                              icon={<Lock fontSize="small" />}
                              label="Anonymous"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                          <Typography variant="body1">{message.message}</Typography>
                          {showTranslation && message.translatedMessage && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Translated:
                              </Typography>
                              <Typography variant="body2">{message.translatedMessage}</Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {formatDateTime(message.timestamp)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleTranslate(message.id)}
                              disabled={isTranslating}
                              sx={{ color: 'inherit' }}
                            >
                              <Translate fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Message Input */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      multiline
                      maxRows={4}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      multiple
                    />
                    <IconButton
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AttachFile />
                    </IconButton>
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      startIcon={<Send />}
                    >
                      Send
                    </Button>
                  </Box>
                </>
              )}

              {activeTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Document Exchange</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Document
                    </Button>
                  </Box>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    multiple
                  />
                  {documents.length === 0 ? (
                    <Alert severity="info">No documents shared yet</Alert>
                  ) : (
                    <List>
                      {documents.map((doc) => (
                        <ListItem
                          key={doc.id}
                          sx={{
                            bgcolor: 'action.hover',
                            mb: 1,
                            borderRadius: 1,
                          }}
                        >
                          <ListItemIcon>
                            <Description />
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.name}
                            secondary={`Uploaded by ${doc.uploadedBy} • ${formatDateTime(doc.uploadedAt)}`}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                          >
                            <Delete />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Negotiation Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bid ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    #{bidId.slice(-6)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip label="Under Review" color="warning" size="small" />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    AI Translation
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      icon={<Translate />}
                      label="Enabled"
                      color="success"
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Auto-translate messages
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Security Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Lock fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="End-to-End Encryption"
                    secondary="All messages are encrypted"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Anonymous Mode"
                    secondary="Identity protected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Translate fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="AI Translation"
                    secondary="Multi-language support"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
