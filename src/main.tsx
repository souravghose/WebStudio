import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Root } from './Root';

// Routing (homepage vs. editor) lives in Root; the editor itself is rendered unchanged by EditorRoute.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
