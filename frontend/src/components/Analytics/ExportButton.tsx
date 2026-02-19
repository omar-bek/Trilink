import { Button } from '@mui/material';
import { FileDownload } from '@mui/icons-material';

interface ExportButtonProps {
  format: 'pdf' | 'excel' | 'csv';
  onClick: () => void;
  disabled?: boolean;
}

export const ExportButton = ({ format, onClick, disabled }: ExportButtonProps) => {
  const formatLabel = format.toUpperCase();

  return (
    <Button
      variant="outlined"
      startIcon={<FileDownload />}
      onClick={onClick}
      disabled={disabled}
      size="small"
    >
      Export {formatLabel}
    </Button>
  );
};
