import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@pramana/ui-components';
import { router } from './router';
import './styles/globals.css';

/**
 * The one React root. Providers that every portal shares live here; a portal's
 * own state (the doctor Redux store) is provided inside that portal, so it is
 * never reachable from the other three.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>,
);
