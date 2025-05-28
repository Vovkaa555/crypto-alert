import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';

import './App.css';
import darkTheme from './utils/theme';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Home />
    </ThemeProvider>
  );
};

export default App;
