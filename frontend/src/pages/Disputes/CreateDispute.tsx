import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateDispute } from '@/hooks/useDisputes';
import { CreateDisputeDto, DISPUTE_TYPES, DisputeAttachment } from '@/types/dispute';
import { AttachmentUpload } from '@/components/Dispute/AttachmentUpload';

const validationSchema = yup.object({
  contractId: yup.string().required('Contract ID is required'),
  againstCompanyId: yup.string().required('Company ID is required'),
  type: yup.string().required('Dispute type is required'),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
});

export const CreateDispute = () => {
  const navigate = useNavigate();
  const createMutation = useCreateDispute();
  const [attachments, setAttachments] = useState<DisputeAttachment[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDisputeDto>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      contractId: '',
      againstCompanyId: '',
      type: '',
      description: '',
      attachments: [],
    },
  });

  const onSubmit = async (data: CreateDisputeDto) => {
    createMutation.mutate(
      { ...data, attachments: attachments.length > 0 ? attachments : undefined },
      {
        onSuccess: () => {
          navigate('/disputes');
        },
      }
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/disputes')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Create Dispute
        </Typography>
      </Box>

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {createMutation.error?.response?.data?.message || 'Failed to create dispute'}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contractId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contract ID"
                      error={!!errors.contractId}
                      helperText={errors.contractId?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="againstCompanyId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Against Company ID"
                      error={!!errors.againstCompanyId}
                      helperText={errors.againstCompanyId?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Dispute Type</InputLabel>
                      <Select {...field} label="Dispute Type">
                        {DISPUTE_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.type && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={6}
                      placeholder="Provide a detailed description of the dispute..."
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Minimum 20 characters required'}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Attachments (Optional)
                </Typography>
                <AttachmentUpload
                  attachments={attachments}
                  onChange={setAttachments}
                  maxFiles={10}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => navigate('/disputes')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Dispute'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
