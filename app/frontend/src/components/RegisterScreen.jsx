import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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

export default function RegisterScreen({
  displayName,
  email,
  password,
  registerError,
  isSubmitting,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBackToLogin
}) {
  return (
    <Box className="container">
      <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography data-cy="register-title" variant="h4">Create account</Typography>
        <Button
          data-cy="register-login-link"
          onClick={onBackToLogin}
          startIcon={<ArrowBackIcon />}
          type="button"
          variant="outlined"
        >
          Back to login
        </Button>
      </Stack>
      <Card data-cy="register-form">
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <TextField
              id="displayName"
              inputProps={{ "data-cy": "register-display-name" }}
              label="Display name"
              onChange={onDisplayNameChange}
              value={displayName}
            />
            <TextField
              id="registerEmail"
              inputProps={{ "data-cy": "register-email" }}
              label="Email"
              onChange={onEmailChange}
              type="email"
              value={email}
            />
            <TextField
              id="registerPassword"
              inputProps={{ "data-cy": "register-password" }}
              label="Password"
              onChange={onPasswordChange}
              type="password"
              value={password}
            />
            <Button
              data-cy="register-submit"
              disabled={isSubmitting}
              startIcon={<AppRegistrationIcon />}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            {registerError ? <Alert data-cy="register-error" severity="error">{registerError}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
