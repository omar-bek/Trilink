import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  History,
  Visibility,
  CompareArrows,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { ContractVersion } from '@/types/contract';
import { formatDateTime } from '@/utils';
import { useState } from 'react';

interface VersionHistoryListProps {
  versions: ContractVersion[];
  currentVersion: number;
  onViewVersion?: (version: number) => void;
  onCompareVersions?: (version1: number, version2: number) => void;
}

export const VersionHistoryList = ({
  versions,
  currentVersion,
  onViewVersion,
  onCompareVersions,
}: VersionHistoryListProps) => {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  const handleVersionSelect = (version: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length < 2) {
        return [...prev, version];
      }
      return [version];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const [v1, v2] = selectedVersions.sort((a, b) => a - b);
      onCompareVersions?.(v1, v2);
      setSelectedVersions([]);
    }
  };

  const getSignatureCount = (version: ContractVersion) => {
    return version.signatures?.length || 0;
  };

  const getSignatureStatus = (version: ContractVersion) => {
    const signatureCount = getSignatureCount(version);
    const partyCount = version.snapshot.parties?.length || 0;
    
    if (signatureCount === 0) {
      return { label: 'No signatures', color: 'default' as const };
    }
    if (signatureCount === partyCount) {
      return { label: 'Fully signed', color: 'success' as const };
    }
    return { label: `Partially signed (${signatureCount}/${partyCount})`, color: 'warning' as const };
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No version history available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ fontSize: 20 }} />
            Version History
          </Typography>
          {selectedVersions.length === 2 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CompareArrows />}
              onClick={handleCompare}
            >
              Compare Selected
            </Button>
          )}
        </Box>
        <List>
          {versions.map((version, index) => {
            const isCurrent = version.version === currentVersion;
            const isSelected = selectedVersions.includes(version.version);
            const signatureStatus = getSignatureStatus(version);
            const canSelect = selectedVersions.length < 2 || isSelected;

            return (
              <Box key={version.id}>
                <ListItem
                  sx={{
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    cursor: canSelect ? 'pointer' : 'default',
                  }}
                  onClick={() => canSelect && handleVersionSelect(version.version)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Version {version.version}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                        {version.reason && (
                          <Typography variant="caption" color="text.secondary">
                            {version.reason}
                          </Typography>
                        )}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Created {formatDateTime(version.createdAt)}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={<CheckCircle />}
                            label={signatureStatus.label}
                            size="small"
                            color={signatureStatus.color}
                            sx={{ height: 20 }}
                          />
                          {version.amendmentId && (
                            <Chip
                              label="Amendment"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Version">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewVersion?.(version.version);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {index < versions.length - 1 && (
                        <Tooltip title="Compare with previous">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompareVersions?.(version.version, versions[index + 1].version);
                            }}
                          >
                            <CompareArrows />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < versions.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            );
          })}
        </List>
        {selectedVersions.length > 0 && selectedVersions.length < 2 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Select {2 - selectedVersions.length} more version to compare
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
