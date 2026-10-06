import { useState, version } from 'react';

export function Widget() {
  const [count, setCount] = useState(0);
  return (
    <section data-remote="remote_a">
      <h2>Remote a</h2>
      <p data-testid="react-version">React {version}</p>
      <button onClick={() => setCount((c) => c + 1)}>clicked {count}</button>
    </section>
  );
}

export default Widget;
