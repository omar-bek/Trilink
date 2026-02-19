import { Alert, AlertTitle, Typography, Box, Link, Divider } from '@mui/material';
import { Info, Gavel, VerifiedUser, Description } from '@mui/icons-material';

interface AIDisclaimerProps {
  variant?: 'standard' | 'compact';
}

export const AIDisclaimer = ({ variant = 'standard' }: AIDisclaimerProps) => {
  if (variant === 'compact') {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        AI recommendations are advisory only. Final decisions remain with authorized personnel. All AI decisions are legally explainable and auditable.
      </Typography>
    );
  }

  return (
    <Alert severity="info" icon={<Info />} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
      <AlertTitle sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Gavel fontSize="small" />
        AI Governance & Legal Explainability Disclaimer
      </AlertTitle>
      
      <Typography variant="body2" component="div" sx={{ mb: 2, fontWeight: 600 }}>
        <strong>AI supports humans, it does not replace them.</strong> All AI decisions are legally explainable and auditable.
      </Typography>

      <Box component="ul" sx={{ m: 0, pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2" component="span">
            <strong>Advisory Nature:</strong> AI scores and recommendations are <strong>advisory tools</strong> designed to assist decision-making. They do not constitute binding decisions or replace human judgment.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Human Responsibility:</strong> Final bid evaluation and selection decisions remain the <strong>sole responsibility</strong> of authorized personnel. Decision-makers must exercise independent judgment.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Legal Explainability:</strong> All AI scoring decisions are <strong>fully explainable</strong> with detailed breakdowns, confidence levels, risk assessments, and reasoning. This information is available for legal review and audit purposes.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Audit Trail:</strong> All AI decisions, including scores, breakdowns, model versions, and timestamps, are <strong>permanently logged</strong> in the audit trail for transparency, compliance, and legal accountability.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Regulatory Compliance:</strong> This system complies with <strong>UAE procurement regulations</strong>, government transparency requirements, and international AI governance standards including explainability and accountability.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Model Transparency:</strong> The AI model version, training data sources, and scoring methodology are documented and available for review. Model updates are versioned and tracked.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Bias Mitigation:</strong> The AI system is designed to minimize bias and ensure fair evaluation. Regular audits are conducted to identify and address potential biases.
          </Typography>
        </li>
        <li>
          <Typography variant="body2" component="span">
            <strong>Right to Explanation:</strong> Users have the right to request detailed explanations of any AI decision affecting them, in accordance with data protection and AI governance regulations.
          </Typography>
        </li>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <VerifiedUser fontSize="small" color="primary" sx={{ mt: 0.5 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Legal & Compliance Contact
          </Typography>
          <Typography variant="body2" component="span">
            For questions about AI scoring methodology, legal explainability, or compliance matters, contact{' '}
            <Link href="mailto:compliance@trilink.ae" underline="hover" sx={{ fontWeight: 600 }}>
              compliance@trilink.ae
            </Link>
            {' '}or{' '}
            <Link href="mailto:support@trilink.ae" underline="hover" sx={{ fontWeight: 600 }}>
              support@trilink.ae
            </Link>
            .
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Description fontSize="small" color="primary" sx={{ mt: 0.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          This disclaimer is part of the AI governance framework ensuring transparency, accountability, and legal compliance in automated decision-making systems.
        </Typography>
      </Box>
    </Alert>
  );
};
