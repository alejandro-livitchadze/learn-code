'use client';

import { useCallback, useState } from 'react';
import { Button, Highlight, InkCard, StepTag, buttonClass } from '@learn-code/ui';
import {
  FillBlanks,
  HighlightsProvider,
  IMPLEMENTED_KINDS,
  Predict,
  SeedBaseProvider,
  StepWidget,
  type HighlightMap,
  type StepResult,
} from '@learn-code/widgets';
import { fixtures, type Fixture } from '../../../../../packages/widgets/src/fixtures';

/** The catalogue's sqlLab fixtures use the seeds of the sample lesson. */
const CATALOGUE_SEEDS = '/seeds/fullstack/joins-01';

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
      <div className="cat-stage legacy-skin">
        <Widget key={run} fixture={fixture} onComplete={onComplete} />
      </div>
      <p className="w-muted" data-testid={`${fixture.id}-calls`}>
        onComplete calls: {calls.length}
        {calls.length > 0 ? ` (last: ${JSON.stringify(calls[calls.length - 1])})` : ''}
      </p>
    </section>
  );
}

/** One kind per distinct tag text. */
const STEP_TAG_SAMPLES = [
  'predict',
  'reveal',
  'explain',
  'sqlLab',
  'parsons',
  'firesideChat',
  'brainPower',
  'matching',
  'pitfall',
  'recall',
  'recap',
  'beTheRuntime',
] as const;

function Story({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="cat-story" id={id} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>{title}</h3>
      <div className="cat-row">{children}</div>
    </section>
  );
}

/** One story per component of @learn-code/ui (E08 section 4). */
function UiComponents() {
  return (
    <section aria-labelledby="ui-h" data-testid="ui-components">
      <h2 id="ui-h">UI components</h2>
      <Story id="ui-button" title="Button">
        <Button variant="primary">Lock in answer</Button>
        <Button>Back</Button>
        <Button variant="primary" disabled>
          Continue
        </Button>
        <Button disabled>Back</Button>
        <a href="#ui-button" className={buttonClass('primary')}>
          Link as primary
        </a>
      </Story>
      <Story id="ui-inkcard" title="InkCard">
        <InkCard>Default</InkCard>
        <InkCard state="lifted">Lifted</InkCard>
        <InkCard state="selected">Selected</InkCard>
      </Story>
      <Story id="ui-steptag" title="StepTag">
        {STEP_TAG_SAMPLES.map((kind) => (
          <StepTag key={kind} kind={kind} />
        ))}
      </Story>
      <Story id="ui-highlight" title="Highlight">
        <p className="cat-prose">
          A join keeps <Highlight>every matching pair</Highlight>, so rows can multiply.
        </p>
      </Story>
    </section>
  );
}

export function Catalogue({ highlights }: { readonly highlights: HighlightMap }) {
  return (
    <HighlightsProvider value={highlights}>
      <SeedBaseProvider value={CATALOGUE_SEEDS}>
        <main className="cat">
          <h1>Widget catalogue</h1>
          <p className="lead">
            Every widget built so far, in its idle, wrong, restored and long-content states. Built:{' '}
            {IMPLEMENTED_KINDS.join(', ')}. Other kinds show a placeholder.
          </p>
          <UiComponents />
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
      </SeedBaseProvider>
      <style>{`
        .cat { max-width: 60rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; display: grid; gap: 1.5rem; }
        .cat-nav { columns: 2; margin: 0; padding-left: 1.2rem; }
        .cat-entry { border: var(--border); background: var(--card); border-radius: var(--radius-card); padding: 1rem 1.25rem; display: grid; gap: 0.75rem; min-width: 0; }
        .cat-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
        .cat-head h3 { margin: 0; font-size: 1rem; }
        .cat-story { display: grid; gap: 0.75rem; margin: 1rem 0 1.5rem; }
        .cat-story h3 { margin: 0; font-size: 15px; letter-spacing: 0.09em; text-transform: uppercase; }
        .cat-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
        .cat-prose { margin: 0; }
        .cat-stage { min-width: 0; }
      `}</style>
    </HighlightsProvider>
  );
}
