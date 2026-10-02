'use client';

import { useCallback, useState } from 'react';
import {
  FillBlanks,
  HighlightsProvider,
  IMPLEMENTED_KINDS,
  Predict,
  StepWidget,
  type HighlightMap,
  type StepResult,
} from '../../../../../packages/widgets/src';
import { fixtures, type Fixture } from '../../../../../packages/widgets/src/fixtures';
import '../../../../../packages/widgets/src/widgets.css';

function Widget({
  fixture,
  onComplete,
}: {
  readonly fixture: Fixture;
  readonly onComplete: (r: StepResult) => void;
}) {
  const { step, restored, preset } = fixture;
  if (step.kind === 'predict' && preset?.tried !== undefined) {
    return (
      <Predict
        step={step}
        restored={restored}
        onComplete={onComplete}
        initialTried={preset.tried}
      />
    );
  }
  if (step.kind === 'fillBlanks' && preset?.checked !== undefined) {
    return (
      <FillBlanks
        step={step}
        restored={restored}
        onComplete={onComplete}
        initialChecked={preset.checked}
      />
    );
  }
  return <StepWidget step={step} restored={restored} onComplete={onComplete} />;
}

function Entry({ fixture }: { readonly fixture: Fixture }) {
  const [calls, setCalls] = useState<readonly StepResult[]>([]);
  const [run, setRun] = useState(0);
  const onComplete = useCallback((r: StepResult) => setCalls((c) => [...c, r]), []);
  return (
    <section className="cat-entry" id={fixture.id} aria-labelledby={`${fixture.id}-h`}>
      <header className="cat-head">
        <h3 id={`${fixture.id}-h`}>{fixture.title}</h3>
        <button
          type="button"
          className="w-btn w-btn-quiet"
          onClick={() => {
            setRun((n) => n + 1);
            setCalls([]);
          }}
        >
          Reset
        </button>
      </header>
      <div className="cat-stage">
        <Widget key={run} fixture={fixture} onComplete={onComplete} />
      </div>
      <p className="w-muted" data-testid={`${fixture.id}-calls`}>
        onComplete calls: {calls.length}
        {calls.length > 0 ? ` (last: ${JSON.stringify(calls[calls.length - 1])})` : ''}
      </p>
    </section>
  );
}

export function Catalogue({ highlights }: { readonly highlights: HighlightMap }) {
  return (
    <HighlightsProvider value={highlights}>
      <main className="cat">
        <h1>Widget catalogue</h1>
        <p className="lead">
          Every widget built so far, in its idle, wrong, restored and long-content states. Built:{' '}
          {IMPLEMENTED_KINDS.join(', ')}. Other kinds show a placeholder.
        </p>
        <nav aria-label="Fixtures">
          <ul className="cat-nav">
            {fixtures.map((f) => (
              <li key={f.id}>
                <a href={`#${f.id}`}>{f.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        {fixtures.map((f) => (
          <Entry key={f.id} fixture={f} />
        ))}
      </main>
      <style>{`
        .cat { max-width: 60rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; display: grid; gap: 1.5rem; }
        .cat-nav { columns: 2; margin: 0; padding-left: 1.2rem; }
        .cat-entry { border: 1px solid var(--border); background: var(--surface); border-radius: 12px; padding: 1rem 1.25rem; display: grid; gap: 0.75rem; min-width: 0; }
        .cat-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
        .cat-head h3 { margin: 0; font-size: 1rem; }
        .cat-stage { min-width: 0; }
      `}</style>
    </HighlightsProvider>
  );
}
