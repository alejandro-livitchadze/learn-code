import { Component, Suspense, lazy, version, type ReactNode } from 'react';

// Types for the federated modules live in remotes.d.ts.
const RemoteA = lazy(() => import('remote_a/Widget'));
const RemoteB = lazy(() => import('remote_b/Widget'));

class Boundary extends Component<{ name: string; children: ReactNode }, { error: string | null }> {
  override state = { error: null as string | null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  override render() {
    return this.state.error === null ? (
      this.props.children
    ) : (
      <p data-testid={`error-${this.props.name}`}>
        {this.props.name} failed: {this.state.error}
      </p>
    );
  }
}

export function App() {
  return (
    <main>
      <h1>Host</h1>
      <p data-testid="host-react-version">Host React {version}</p>
      <Boundary name="remote_a">
        <Suspense fallback={<p>loading remote_a</p>}>
          <RemoteA />
        </Suspense>
      </Boundary>
      <Boundary name="remote_b">
        <Suspense fallback={<p>loading remote_b</p>}>
          <RemoteB />
        </Suspense>
      </Boundary>
    </main>
  );
}
