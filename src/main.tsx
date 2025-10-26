import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from './components/Toaster';
import { AuthProvider } from './auth/AuthContext';
import './index.css';
import App from './App';
import { system } from './theme/theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChakraProvider value={system ?? defaultSystem}>
        <BrowserRouter>
        <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    </ThemeProvider>
  </StrictMode>
);
