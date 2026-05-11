import { Toolbar } from './components/toolbar/Toolbar.js';
import { NetworkCanvas } from './components/canvas/NetworkCanvas.js';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A' }}>
      <Toolbar />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <NetworkCanvas />
      </div>
    </div>
  );
}
