import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Create a shadow root container to isolate styles
const container = document.createElement('div');
container.id = 'arc-overlay-root';
document.body.appendChild(container);

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
