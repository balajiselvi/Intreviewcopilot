import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function AnswerQualityPanel({ analysis }) {
  if (!analysis) return null;
  const { metrics, findings = [], followups = [], gaps = [] } = analysis;

  return (
    <Accordion disableGutters elevation={0} sx={{ mt: 1, bgcolor: 'transparent', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 'auto' }}>
        <Chip
          size="small"
          variant="outlined"
          label="Practice feedback"
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Delivery hints and practice prompts. Technical accuracy and personal experience have not been verified.
        </Typography>
        {metrics && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {metrics.words} words · about {metrics.estimatedSpokenSeconds}s spoken at 140 words/min
          </Typography>
        )}

        {findings.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" fontWeight="bold" display="block">Findings</Typography>
            {findings.map((finding, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary">• {finding}</Typography>
            ))}
          </>
        )}

        {followups.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" fontWeight="bold" display="block">Possible follow-ups</Typography>
            {followups.map((question, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary">• {question}</Typography>
            ))}
          </>
        )}

        {gaps.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" fontWeight="bold" display="block" color="warning.main">Gaps</Typography>
            {gaps.map((gap, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary">• {gap}</Typography>
            ))}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
