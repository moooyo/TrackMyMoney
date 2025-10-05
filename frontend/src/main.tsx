import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import logger from '@/utils/logger';

// Enable MSW in development mode
async function enableMocking() {
  // Check if mock should be enabled
  // Use VITE_USE_MOCK env var to control, defaults to true in DEV mode
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false' && import.meta.env.DEV;

  if (useMock) {
    // Check if Service Worker is supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      logger.warn('Service Worker is not supported in this environment. MSW disabled.');
      return;
    }

    try {
      const { worker } = await import('./mocks');
      if (!worker) {
        logger.error('MSW worker failed to initialize');
        return;
      }

      await worker.start({
        onUnhandledRequest: 'bypass',
      });
      logger.info('MSW enabled in development mode');
    } catch (error) {
      logger.error('Failed to start MSW:', error);
    }
  } else if (import.meta.env.DEV) {
    logger.info('MSW disabled - connecting to real backend');
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
