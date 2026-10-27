// Isolated lifecycle fixture; never imported by the production entry point.
import { createRoot } from 'react-dom/client';
import { NavigationProvider } from '../../src/context/NavigationContext';
import { CinematicEntry } from '../../src/features/cinematic-entry/CinematicEntry';
const root = createRoot(document.getElementById('test-root')!);
root.render(<NavigationProvider><CinematicEntry><main><h1>Lifecycle fixture</h1></main></CinematicEntry></NavigationProvider>);
(window as any).unmountEntryFixture = () => root.unmount();
