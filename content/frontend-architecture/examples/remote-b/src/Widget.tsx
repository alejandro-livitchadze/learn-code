import { useState, version } from 'react';

export function Widget() {
  const [count, setCount] = useState(0);
  return (
    <section data-remote="remote_b">
      <h2>Remote b</h2>
      <p data-testid="react-version">React {version}</p>
      <button onClick={() => setCount((c) => c + 1)}>clicked {count}</button>
    </section>
  );
}

export default Widget;
