import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb"
    },
    secondary: {
      main: "#0f766e"
    },
    background: {
      default: "#f3f6fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#0f172a",
      secondary: "#334155"
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 650
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained"
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
        }
      }
    }
  }
});

export default theme;
