'use client';

import { useCallback, useState } from 'react';
import {
  Annotation,
  Button,
  Character,
  Cliffhanger,
  FeedbackBanner,
  Gotcha,
  Highlight,
  HintLadder,
  InkCard,
  MiniDiagram,
  ReviewCard,
  SpeechBubble,
  StepTag,
  StickyNote,
  StopAndThink,
  buttonClass,
} from '@learn-code/ui';
import {
  FillBlanks,
  HighlightsProvider,
  IMPLEMENTED_KINDS,
  MarginItems,
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
        <Button
          onClick={() => {
            setRun((n) => n + 1);
            setCalls([]);
          }}
        >
          Reset
        </Button>
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
      <Story id="ui-characters" title="Characters">
        <Character who="bug" />
        <Character who="olha" />
        <Character who="runtime" />
      </Story>
      <Story id="ui-sticky" title="StickyNote">
        <StickyNote label="Olha asks">Wait, doesn&apos;t a join just add more columns?</StickyNote>
        <StickyNote label="Olha says">Oh. It counts pairs.</StickyNote>
      </Story>
      <Story id="ui-bubble" title="SpeechBubble">
        <SpeechBubble>Friday, 18:40. I may have helped.</SpeechBubble>
      </Story>
      <Story id="ui-gotcha" title="Gotcha">
        <Gotcha>A join never asks how many orders you have. It counts matching pairs.</Gotcha>
      </Story>
      <Story id="ui-stop" title="StopAndThink">
        <StopAndThink>Take one order. What does that single order turn into?</StopAndThink>
      </Story>
      <Story id="ui-annotation" title="Annotation">
        <Annotation>100 rows in here</Annotation>
        <Annotation curve="down">the matching rule</Annotation>
      </Story>
      <Story id="ui-feedback" title="FeedbackBanner">
        <FeedbackBanner correct title="400 rows. You got it." aside="picked 100? see the note">
          Every order shows up once per matching item: 100 x 4.
        </FeedbackBanner>
        <FeedbackBanner correct={false} title="Not quite.">
          A join keeps pairs, not orders.
        </FeedbackBanner>
      </Story>
      <Story id="ui-diagram" title="MiniDiagram">
        <MiniDiagram
          caption="one order, four items"
          elements={[
            { type: 'chip', text: 'order 7', tone: 'ink' },
            { type: 'arrow' },
            { type: 'cards', texts: ['mug', 'tee', 'cap', 'pin'] },
          ]}
        />
      </Story>
      <Story id="ui-review" title="ReviewCard">
        <ReviewCard
          question="An order with 3 items, joined to items. How many rows?"
          due="in 3 days"
        />
      </Story>
      <Story id="ui-cliffhanger" title="Cliffhanger">
        <Cliffhanger>
          Order 12 has no items. It just vanished from your report. Where did it go?
        </Cliffhanger>
      </Story>
      <Story id="ui-hints" title="HintLadder">
        <HintLadder
          hints={[
            'Look at the join condition.',
            'Count the matches for one order.',
            'It is 4 per order.',
          ]}
        />
      </Story>
      <Story id="ui-margin" title="Margin items from lesson data">
        <div className="cat-margin">
          <MarginItems
            items={[
              { type: 'sticky', who: 'olha', label: 'asks', text: 'Is that really 400?' },
              { type: 'bubble', who: 'runtime', text: 'Rules are rules.' },
              { type: 'gotcha', text: 'Pairs, not orders.' },
              { type: 'stopAndThink', text: 'What does one order become?' },
              { type: 'diagram', ref: 'one-order-four-items', caption: 'one order, four items' },
            ]}
          />
        </div>
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
            {IMPLEMENTED_KINDS.join(', ')}. Other kinds show a short notice.
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
        .cat-margin { display: flex; flex-direction: column; gap: var(--space-22); width: 280px; }
      `}</style>
    </HighlightsProvider>
  );
}
