import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";

export default function HelpPage({ onBack, showSimpleHeader = true }) {
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

  return (
    <Box>
      {showSimpleHeader ? (
        <AppBar position="static" sx={{ borderRadius: 3, mt: 2, mb: 2 }}>
          <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
            <Typography
              component="h1"
              data-cy="unauth-store-title"
              sx={{ display: "flex", alignItems: "center", fontWeight: 700, mr: 1 }}
              variant="h6"
            >
              <StorefrontIcon sx={{ mr: 1 }} />
              Good Vibes
            </Typography>
            {onBack ? (
              <Box sx={{ ml: "auto" }}>
                <Button data-cy="help-back" onClick={onBack} startIcon={<ArrowBackIcon />} type="button">
                  Back
                </Button>
              </Box>
            ) : null}
          </Toolbar>
        </AppBar>
      ) : null}

      {loading ? (
        <Card data-cy="help-page-loading" sx={{ mt: 2 }}>
          <CardContent>
            <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>
            <Stack alignItems="center" direction="row" spacing={1}>
              <CircularProgress aria-label="Loading help content" size={18} />
              <Typography>Loading...</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card data-cy="help-page-error" sx={{ mt: 2 }}>
          <CardContent>
            <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>
            <Alert sx={{ mb: 2 }} severity="error">{error}</Alert>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error ? (
        <Card data-cy="help-page" sx={{ mt: 2 }}>
          <CardContent>
            <Typography data-cy="help-page-title" gutterBottom variant="h5">Help</Typography>

            <Typography sx={{ mt: 1 }} variant="h6">Navigation tips</Typography>
            <List data-cy="help-navigation-tips" sx={{ p: 0 }}>
              {(helpData?.navigationTips || []).map((tip, index) => (
                <ListItem key={`${tip}-${index}`} sx={{ px: 0 }}>
                  <Typography>{tip}</Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
