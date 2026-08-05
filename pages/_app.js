import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from '../store'; // 👈 Adjust this path if your store file is located elsewhere (e.g., ../redux/store or ../src/store)
import darkTheme from '../theme';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </Provider>
  );
}

export default MyApp;