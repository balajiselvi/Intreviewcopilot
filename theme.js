import { createTheme } from '@mui/material/styles';
import { red, grey } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: grey[100],
      paper: '#ffffff',
    },
    text: {
      primary: grey[900],
      secondary: grey[700],
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#333333',
      marginBottom: '0.75em',
    },
    h5: {
      fontWeight: 600,
      color: '#444444',
      marginBottom: '0.5em',
    },
    h6: {
      fontWeight: 600,
      color: '#555555',
      marginBottom: '0.5em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    body1: {
      lineHeight: 1.6,
    },
    caption: {
      color: grey[600],
    }
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 5px 15px rgba(0,0,0,0.08)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          }
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1565c0',
          }
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#9a0036',
          }
        },
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#1976d2',
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        }
      }
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)',
            }
        }
    },
    MuiList: {
        styleOverrides: {
            root: {
                '& .MuiListItem-root': {
                    borderRadius: 8,
                }
            }
        }
    }
  }
});

export const darkTheme = createTheme(theme, {
  palette: {
    mode: 'dark',
    primary: {
      main: '#42a5f5',
      light: '#80d6ff',
      dark: '#0077c2',
      contrastText: '#0a0a0a',
    },
    secondary: {
      main: '#ff4081',
      light: '#ff79b0',
      dark: '#c60055',
      contrastText: '#0a0a0a',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: grey[100],
      secondary: grey[400],
    },
  },
  typography: {
    h4: { color: grey[100] },
    h5: { color: grey[200] },
    h6: { color: grey[300] },
    caption: { color: grey[500] },
  },
});

export default darkTheme;