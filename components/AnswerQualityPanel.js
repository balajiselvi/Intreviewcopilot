import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function scoreColor(score) {
  if (score >= 8.5) return 'success';
  if (score >= 6.5) return 'warning';
  return 'error';
}

const CATEGORY_LABELS = {
  technicalAccuracy: 'Technical Accuracy',
  experienceConsistency: 'Experience Consistency',
  spokenDelivery: 'Spoken Delivery',
  naturalConversation: 'Natural Conversation',
  ownership: 'Ownership',
  completeness: 'Completeness',
  followUpReadiness: 'Follow-up Readiness',
  conciseness: 'Conciseness'
};

export default function AnswerQualityPanel({ analysis }) {
  if (!analysis) return null;
  const { overallScore, scale = 10, breakdown = [], findings = [], followups = [], gaps = [] } = analysis;

  return (
    <Accordion disableGutters elevation={0} sx={{ mt: 1, bgcolor: 'transparent', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 'auto' }}>
        <Chip
          size="small"
          color={scoreColor(overallScore)}
          label={`Answer Quality: ${overallScore}/${scale}`}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <List dense disablePadding>
          {breakdown.map(row => (
            <ListItem key={row.category} disableGutters sx={{ py: 0.25 }}>
              <ListItemText
                primary={CATEGORY_LABELS[row.category] || row.category}
                secondary={`${row.score.toFixed ? row.score.toFixed(1) : row.score}/${scale} · weight ${(row.weight * 100).toFixed(0)}%`}
              />
            </ListItem>
          ))}
        </List>

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
