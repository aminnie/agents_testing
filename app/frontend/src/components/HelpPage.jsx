import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Button, Card, CardContent, CircularProgress, List, ListItem, Stack, Typography } from "@mui/material";

export default function HelpPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [helpData, setHelpData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("/api/help")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("HELP_LOAD_FAILED");
        }
        return response.json();
      })
      .then((payload) => setHelpData(payload))
      .catch(() => setError("Unable to load help information right now."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card data-cy="help-page-loading" sx={{ mt: 2 }}>
        <CardContent>
          <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>
          <Stack alignItems="center" direction="row" spacing={1}>
            <CircularProgress size={18} />
            <Typography>Loading...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-cy="help-page-error" sx={{ mt: 2 }}>
        <CardContent>
          <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>
          <Alert sx={{ mb: 2 }} severity="error">{error}</Alert>
        {onBack ? (
          <Button data-cy="help-back" onClick={onBack} startIcon={<ArrowBackIcon />} type="button">
            Back
          </Button>
        ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-cy="help-page" sx={{ mt: 2 }}>
      <CardContent>
      <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>

      <Typography sx={{ mt: 1 }} variant="h6">Demo users</Typography>
      <List data-cy="help-demo-users" sx={{ p: 0 }}>
        {(helpData?.demoUsers || []).map((user) => (
          <ListItem key={user.email} sx={{ px: 0 }}>
            <Typography>
              <strong>{user.email}</strong> / {user.password} ({user.role})
            </Typography>
          </ListItem>
        ))}
      </List>

      <Typography sx={{ mt: 1 }} variant="h6">Navigation tips</Typography>
      <List data-cy="help-navigation-tips" sx={{ p: 0 }}>
        {(helpData?.navigationTips || []).map((tip, index) => (
          <ListItem key={`${tip}-${index}`} sx={{ px: 0 }}>
            <Typography>{tip}</Typography>
          </ListItem>
        ))}
      </List>

      {onBack ? (
        <Button data-cy="help-back" onClick={onBack} startIcon={<ArrowBackIcon />} type="button">
          Back
        </Button>
      ) : null}
      </CardContent>
    </Card>
  );
}
