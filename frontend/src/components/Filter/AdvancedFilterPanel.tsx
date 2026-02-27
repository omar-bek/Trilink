import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  ExpandLess,
  Clear,
  Save,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Package not installed
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface FilterOption {
  value: string;
  label: string;
}

export interface AdvancedFilterConfig {
  status?: {
    label: string;
    options: FilterOption[];
    multiSelect?: boolean;
  };
  type?: {
    label: string;
    options: FilterOption[];
    multiSelect?: boolean;
  };
  dateRange?: {
    label: string;
    startLabel?: string;
    endLabel?: string;
  };
  search?: {
    label: string;
    placeholder?: string;
  };
  custom?: Array<{
    key: string;
    label: string;
    type: 'select' | 'text' | 'number';
    options?: FilterOption[];
    multiSelect?: boolean;
  }>;
}

export interface AdvancedFilters {
  status?: string | string[];
  type?: string | string[];
  startDate?: Date | null;
  endDate?: Date | null;
  search?: string;
  [key: string]: any;
}

interface AdvancedFilterPanelProps {
  config: AdvancedFilterConfig;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset?: () => void;
  onSavePreset?: (name: string, filters: AdvancedFilters) => void;
  savedPresets?: Array<{ name: string; filters: AdvancedFilters }>;
  onLoadPreset?: (filters: AdvancedFilters) => void;
}

export const AdvancedFilterPanel = ({
  config,
  filters,
  onFiltersChange,
  onReset,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
}: AdvancedFilterPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleMultiSelectChange = (key: string, value: string[]) => {
    handleFilterChange(key, value.length > 0 ? value : undefined);
  };

  const handleReset = () => {
    const resetFilters: AdvancedFilters = {};
    onFiltersChange(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName, filters);
      setPresetName('');
    }
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
  ).length;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 2 : 0 }}>
          <Button
            startIcon={<FilterList />}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setExpanded(!expanded)}
            variant="outlined"
            size="small"
          >
            Advanced Filters
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, minWidth: 20 }}
              />
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              startIcon={<Clear />}
              onClick={handleReset}
              size="small"
              variant="text"
            >
              Clear All
            </Button>
          )}
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Search */}
            {config.search && (
              <TextField
                fullWidth
                label={config.search.label}
                placeholder={config.search.placeholder || 'Search...'}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Status Filter */}
              {config.status && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>{config.status.label}</InputLabel>
                  <Select
                    multiple={config.status.multiSelect}
                    value={config.status.multiSelect 
                      ? (filters.status as string[] || [])
                      : (filters.status || '')
                    }
                    label={config.status.label}
                    onChange={(e) => {
                      if (config.status?.multiSelect) {
                        handleMultiSelectChange('status', e.target.value as string[]);
                      } else {
                        handleFilterChange('status', e.target.value || undefined);
                      }
                    }}
                    renderValue={(selected) => {
                      if (config.status?.multiSelect) {
                        return (selected as string[]).map((val) => {
                          const option = config.status?.options.find((opt) => opt.value === val);
                          return option?.label || val;
                        }).join(', ');
                      }
                      const option = config.status?.options.find((opt) => opt.value === selected);
                      return option?.label || selected || '';
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {config.status.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Type Filter */}
              {config.type && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>{config.type.label}</InputLabel>
                  <Select
                    multiple={config.type.multiSelect}
                    value={config.type.multiSelect 
                      ? (filters.type as string[] || [])
                      : (filters.type || '')
                    }
                    label={config.type.label}
                    onChange={(e) => {
                      if (config.type?.multiSelect) {
                        handleMultiSelectChange('type', e.target.value as string[]);
                      } else {
                        handleFilterChange('type', e.target.value || undefined);
                      }
                    }}
                    renderValue={(selected) => {
                      if (config.type?.multiSelect) {
                        return (selected as string[]).map((val) => {
                          const option = config.type?.options.find((opt) => opt.value === val);
                          return option?.label || val;
                        }).join(', ');
                      }
                      const option = config.type?.options.find((opt) => opt.value === selected);
                      return option?.label || selected || '';
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {config.type.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Custom Filters */}
              {config.custom?.map((customFilter) => (
                <FormControl key={customFilter.key} size="small" sx={{ minWidth: 200 }}>
                  {customFilter.type === 'select' ? (
                    <>
                      <InputLabel>{customFilter.label}</InputLabel>
                      <Select
                        multiple={customFilter.multiSelect}
                        value={customFilter.multiSelect
                          ? (filters[customFilter.key] as string[] || [])
                          : (filters[customFilter.key] || '')
                        }
                        label={customFilter.label}
                        onChange={(e) => {
                          if (customFilter.multiSelect) {
                            handleMultiSelectChange(customFilter.key, e.target.value as string[]);
                          } else {
                            handleFilterChange(customFilter.key, e.target.value || undefined);
                          }
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {customFilter.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </>
                  ) : customFilter.type === 'number' ? (
                    <TextField
                      label={customFilter.label}
                      type="number"
                      value={filters[customFilter.key] || ''}
                      onChange={(e) => handleFilterChange(customFilter.key, e.target.value ? Number(e.target.value) : undefined)}
                      size="small"
                    />
                  ) : (
                    <TextField
                      label={customFilter.label}
                      value={filters[customFilter.key] || ''}
                      onChange={(e) => handleFilterChange(customFilter.key, e.target.value || undefined)}
                      size="small"
                    />
                  )}
                </FormControl>
              ))}
            </Box>

            {/* Date Range */}
            {config.dateRange && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  type="date"
                  label={config.dateRange.startLabel || 'Start Date'}
                  value={filters.startDate ? (filters.startDate instanceof Date ? filters.startDate.toISOString().split('T')[0] : String(filters.startDate)) : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  type="date"
                  label={config.dateRange.endLabel || 'End Date'}
                  value={filters.endDate ? (filters.endDate instanceof Date ? filters.endDate.toISOString().split('T')[0] : String(filters.endDate)) : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              </Box>
            )}

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Active Filters:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === undefined || value === null || value === '') return null;
                      if (Array.isArray(value) && value.length === 0) return null;
                      
                      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                      return (
                        <Chip
                          key={key}
                          label={`${key}: ${displayValue}`}
                          size="small"
                          onDelete={() => handleFilterChange(key, undefined)}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              </>
            )}

            {/* Save Preset */}
            {onSavePreset && (
              <>
                <Divider />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    startIcon={<Save />}
                    onClick={handleSavePreset}
                    disabled={!presetName}
                    size="small"
                    variant="outlined"
                  >
                    Save Preset
                  </Button>
                </Box>
              </>
            )}

            {/* Load Presets */}
            {savedPresets.length > 0 && onLoadPreset && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Saved Presets:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {savedPresets.map((preset) => (
                    <Chip
                      key={preset.name}
                      label={preset.name}
                      size="small"
                      onClick={() => onLoadPreset(preset.filters)}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};
