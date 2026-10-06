// Standalone entry; the host consumes ./Widget through the manifest.
import { createRoot } from 'react-dom/client';
import { Widget } from './Widget';

createRoot(document.getElementById('root')!).render(<Widget />);
