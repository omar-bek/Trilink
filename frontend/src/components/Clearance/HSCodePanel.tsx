import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Info,
  Code as CodeIcon,
} from '@mui/icons-material';

interface HSCodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  dutyRate: number;
  category: string;
}

// Mock data
const mockSuggestions: HSCodeSuggestion[] = [
  {
    code: '8517.12.00',
    description: 'Smartphones, cellular or other wireless networks',
    confidence: 95,
    dutyRate: 5.0,
    category: 'Electronics',
  },
  {
    code: '8517.11.00',
    description: 'Telephone sets, including telephones for cellular networks',
    confidence: 88,
    dutyRate: 5.0,
    category: 'Electronics',
  },
  {
    code: '8528.72.00',
    description: 'Monitors and projectors, not incorporating television reception apparatus',
    confidence: 75,
    dutyRate: 0.0,
    category: 'Electronics',
  },
];

export const HSCodePanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<HSCodeSuggestion[]>([]);
  const [selectedCode, setSelectedCode] = useState<HSCodeSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSuggestions(mockSuggestions);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectCode = (code: HSCodeSuggestion) => {
    setSelectedCode(code);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 1 }}>
          HS Code Suggestion Assistant
        </Typography>
        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
          Search and verify Harmonized System codes for your products
        </Typography>
      </Box>

      {/* Search Section */}
      <Card sx={{ mb: 3, backgroundColor: '#1E293B' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter product description or HS code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0F172A',
                  color: '#F1F5F9',
                  '& fieldset': {
                    borderColor: 'rgba(135, 206, 235, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#87CEEB',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4682B4',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#CBD5E1',
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              sx={{
                backgroundColor: '#4682B4',
                '&:hover': { backgroundColor: '#2563EB' },
                minWidth: 120,
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {searchQuery && suggestions.length === 0 && !isSearching && (
            <Alert severity="info" sx={{ backgroundColor: 'rgba(70, 130, 180, 0.1)' }}>
              No suggestions found. Try a different search term.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#1E293B' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 2 }}>
                  Suggested HS Codes
                </Typography>
                <List>
                  {suggestions.map((suggestion, index) => (
                    <Box key={suggestion.code}>
                      <ListItem
                        button
                        onClick={() => handleSelectCode(suggestion)}
                        sx={{
                          backgroundColor:
                            selectedCode?.code === suggestion.code
                              ? 'rgba(70, 130, 180, 0.2)'
                              : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(51, 65, 85, 0.5)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CodeIcon sx={{ color: '#87CEEB', fontSize: 20 }} />
                              <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                {suggestion.code}
                              </Typography>
                              <Chip
                                label={`${suggestion.confidence}%`}
                                size="small"
                                sx={{
                                  backgroundColor: getConfidenceColor(suggestion.confidence),
                                  color: '#FFFFFF',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 0.5 }}>
                                {suggestion.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={suggestion.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: '#4682B4', color: '#87CEEB' }}
                                />
                                <Chip
                                  label={`Duty: ${suggestion.dutyRate}%`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: '#4682B4', color: '#87CEEB' }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < suggestions.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)' }} />
                      )}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Selected Code Details */}
          <Grid item xs={12} md={6}>
            {selectedCode ? (
              <Card sx={{ backgroundColor: '#1E293B' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircle sx={{ color: '#10b981' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                      Selected HS Code
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#87CEEB', mb: 1 }}>
                      {selectedCode.code}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#CBD5E1', mb: 2 }}>
                      {selectedCode.description}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)', mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 0.5 }}>
                        Confidence
                      </Typography>
                      <Typography variant="h6" sx={{ color: getConfidenceColor(selectedCode.confidence) }}>
                        {selectedCode.confidence}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 0.5 }}>
                        Duty Rate
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                        {selectedCode.dutyRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 0.5 }}>
                        Category
                      </Typography>
                      <Chip
                        label={selectedCode.category}
                        sx={{ backgroundColor: '#4682B4', color: '#FFFFFF' }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<CheckCircle />}
                      sx={{
                        backgroundColor: '#4682B4',
                        '&:hover': { backgroundColor: '#2563EB' },
                      }}
                    >
                      Use This Code
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ backgroundColor: '#1E293B' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Info sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#CBD5E1' }}>
                      Select an HS code to view detailed information
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
