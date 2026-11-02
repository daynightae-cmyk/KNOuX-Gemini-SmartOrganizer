import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NavigationProvider } from '../../src/context/NavigationContext';
import { CommandCanvas } from '../../src/visual/CommandCanvas';
import './command-canvas.css';

function Inspector({ name }: { name: string }) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(false);
  return <div data-testid={`inspector-${name}`}><label>{name}<input aria-label={`${name} draft`} value={text} onChange={event => setText(event.target.value)} /></label><label><input type="checkbox" aria-label={`${name} selected`} checked={selected} onChange={event => setSelected(event.target.checked)} />Selected</label></div>;
}
function Fixture() {
  const [observation, setObservation] = useState(0);
  return <div className="canvas-regression"><h1>Isolated state-preservation fixture</h1><button onClick={() => setObservation(value => value + 1)}>Native observation update</button><output>{observation}</output><CommandCanvas locale="en">
    <div key="first" className="scan-results-grid"><section>Measured panel A</section><Inspector name="alpha" /></div>
    <div key="second" className="apps-work-grid"><section>Measured panel B</section><Inspector name="beta" /></div>
    <section key="details">Independent details panel</section>
  </CommandCanvas></div>;
}
createRoot(document.getElementById('root')!).render(<NavigationProvider><Fixture /></NavigationProvider>);
