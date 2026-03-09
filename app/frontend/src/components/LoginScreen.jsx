import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LoginIcon from "@mui/icons-material/Login";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from "@mui/material";

export default function LoginScreen({
  email,
  password,
  authError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoHelp
}) {
  return (
    <Box className="container">
      <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography data-cy="login-title" variant="h4">Mini Store Login</Typography>
        <Button data-cy="login-help" onClick={onGoHelp} startIcon={<HelpOutlineIcon />} type="button" variant="outlined">
          Help
        </Button>
      </Stack>
      <Card data-cy="login-form">
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <TextField
              id="email"
              inputProps={{ "data-cy": "login-email" }}
              label="Email"
              onChange={onEmailChange}
              type="email"
              value={email}
            />
            <TextField
              id="password"
              inputProps={{ "data-cy": "login-password" }}
              label="Password"
              onChange={onPasswordChange}
              type="password"
              value={password}
            />
            <Button data-cy="login-submit" startIcon={<LoginIcon />} type="submit">
              Sign in
            </Button>
            {authError ? <Alert data-cy="login-error" severity="error">{authError}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
