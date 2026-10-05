import type { Step } from '@learn-code/lesson-schema';
import type { StepResult } from './types';

export interface Fixture {
  readonly id: string;
  readonly title: string;
  readonly step: Step;
  readonly restored?: StepResult;
  /** Catalogue-only preset states for widgets that have one. */
  readonly preset?: {
    readonly tried?: readonly number[];
    readonly checked?: Readonly<Record<string, string>>;
  };
}

const base = { estSeconds: 30, concepts: ['joins'] } as const;
const answered = (attempts: number, payload: unknown): StepResult => ({
  status: 'answered',
  correct: true,
  attempts,
  payload,
});

const LONG_LINE =
  "select users.id, users.display_name, orders.id as order_id, orders.total_cents, orders.created_at from users left join orders on orders.user_id = users.id where orders.created_at >= '2025-01-01' order by orders.created_at desc";

const joinQuery = `select u.name, o.total
from users u
left join orders o on o.user_id = u.id
where o.total > 10;`;

const predictOptions = [
  {
    output: 'Ada, 25\nGrace, 40',
    isCorrect: false,
    feedback: 'Ada has no order above 10, so she is filtered out.',
    misconception: 'left-join-keeps-unmatched-rows',
  },
  {
    output: 'Grace, 40',
    isCorrect: true,
    feedback: 'Right: the where clause removes the rows with a missing order.',
  },
  {
    output: 'Ada, null\nGrace, 40',
    isCorrect: false,
    feedback: 'The where clause runs after the join and drops null totals.',
    misconception: 'where-runs-before-join',
  },
] as const;

export const fixtures: readonly Fixture[] = [
  {
    id: 'hook-normal',
    title: 'Hook, normal',
    step: {
      ...base,
      id: 'fx-hook-1',
      kind: 'hook',
      character: 'bug',
      body: 'It is Friday, 16:55. Your report shows **no customers without orders**. Somebody swears there are some. Where did they go?',
    },
  },
  {
    id: 'hook-long',
    title: 'Hook, long content',
    step: {
      ...base,
      id: 'fx-hook-2',
      kind: 'hook',
      character: 'mrRuntime',
      body: `${'This is a long story about a report that silently dropped rows, and nobody noticed for weeks. '.repeat(6)}\n\nSecond paragraph with \`inline code\` and a list:\n\n- first thing\n- second thing`,
    },
  },
  {
    id: 'explain-normal',
    title: 'Explain, notes revealed one by one',
    step: {
      ...base,
      id: 'fx-explain-1',
      kind: 'explain',
      body: 'A `left join` keeps **every** row from the left table.',
      code: joinQuery,
      annotations: [
        { line: 2, text: 'every user stays' },
        { line: 3, text: 'orders may be missing' },
        { line: 4, text: 'this filter removes the missing ones' },
      ],
    },
  },
  {
    id: 'explain-long',
    title: 'Explain, long code line',
    step: {
      ...base,
      id: 'fx-explain-2',
      kind: 'explain',
      body: 'Long lines scroll inside the code block, not the page.',
      code: LONG_LINE,
      annotations: [{ line: 1, text: 'one very long line' }],
    },
  },
  {
    id: 'recap-normal',
    title: 'Recap, bullets one at a time',
    step: {
      ...base,
      id: 'fx-recap-1',
      kind: 'recap',
      points: [
        '`left join` keeps every left row.',
        'A `where` on the right table can undo that.',
        'Put the condition in `on` instead.',
      ],
    },
  },
  {
    id: 'recap-long',
    title: 'Recap, long content',
    step: {
      ...base,
      id: 'fx-recap-2',
      kind: 'recap',
      points: [
        'A very long point that keeps going and going so that wrapping can be checked in the layout. '.repeat(
          3,
        ),
        'Second **bold** point.',
        'Third point.',
        'Fourth point.',
      ],
    },
  },
  {
    id: 'cliff-normal',
    title: 'Cliffhanger',
    step: {
      ...base,
      id: 'fx-cliff-1',
      kind: 'cliffhanger',
      question: 'What happens when two orders match one user, and the report suddenly doubles?',
      nextLessonId: 'joins-02',
    },
  },
  {
    id: 'pitfall-normal',
    title: 'Pitfall, bad and good code',
    step: {
      ...base,
      id: 'fx-pitfall-1',
      kind: 'pitfall',
      language: 'sql',
      body: 'Filtering the right table in `where` turns a left join into an inner join.',
      badCode: joinQuery,
      goodCode:
        'select u.name, o.total\nfrom users u\nleft join orders o on o.user_id = u.id and o.total > 10;',
    },
  },
  {
    id: 'pitfall-long',
    title: 'Pitfall, long code, no good code',
    step: {
      ...base,
      id: 'fx-pitfall-2',
      kind: 'pitfall',
      language: 'sql',
      body: 'A long line must scroll inside its box.',
      badCode: LONG_LINE,
    },
  },
  {
    id: 'predict-idle',
    title: 'Predict, idle',
    step: {
      ...base,
      id: 'fx-predict-1',
      kind: 'predict',
      language: 'sql',
      code: joinQuery,
      options: predictOptions,
    },
  },
  {
    id: 'predict-wrong',
    title: 'Predict, wrong answer shown (with misconception)',
    step: {
      ...base,
      id: 'fx-predict-2',
      kind: 'predict',
      language: 'sql',
      code: joinQuery,
      options: predictOptions,
    },
    preset: { tried: [0] },
  },
  {
    id: 'predict-restored',
    title: 'Predict, restored (answered, no onComplete)',
    step: {
      ...base,
      id: 'fx-predict-3',
      kind: 'predict',
      language: 'sql',
      code: joinQuery,
      options: predictOptions,
    },
    restored: answered(2, { chosen: 1 }),
  },
  {
    id: 'predict-long',
    title: 'Predict, long content (four options, long line)',
    step: {
      ...base,
      id: 'fx-predict-4',
      kind: 'predict',
      language: 'sql',
      code: LONG_LINE,
      options: [
        {
          output: 'every user, with or without orders, newest order first',
          isCorrect: true,
          feedback: 'Yes, the left join keeps everyone.',
        },
        {
          output: 'only users with orders created in 2025 or later',
          isCorrect: false,
          feedback: 'The where clause does that, which is the trap.',
          misconception: 'where-filters-after-join',
        },
        {
          output: 'an error: order by on a joined column',
          isCorrect: false,
          feedback: 'Ordering by a joined column is fine.',
          misconception: 'order-by-needs-selected-column',
        },
        {
          output: 'one row per user',
          isCorrect: false,
          feedback: 'A user with two orders appears twice.',
          misconception: 'join-is-one-to-one',
        },
      ],
    },
  },
  {
    id: 'fill-idle',
    title: 'FillBlanks, idle',
    step: {
      ...base,
      id: 'fx-fill-1',
      kind: 'fillBlanks',
      language: 'sql',
      template: 'select u.name, o.total\nfrom users u\n___kw___ join orders o on o.user_id = u.id;',
      blanks: [
        {
          id: 'kw',
          accepted: ['left', 'left outer'],
          feedback: 'We want to keep users without orders.',
          misconception: 'inner-join-keeps-all-rows',
        },
      ],
    },
  },
  {
    id: 'fill-wrong',
    title: 'FillBlanks, wrong answer checked',
    step: {
      ...base,
      id: 'fx-fill-2',
      kind: 'fillBlanks',
      language: 'sql',
      template:
        'select u.name, count(o.id)\nfrom users u\n___kw___ join orders o on o.user_id = u.id\n___g___ by u.name;',
      blanks: [
        { id: 'kw', accepted: ['left'], feedback: 'We want to keep users without orders.' },
        { id: 'g', accepted: ['group'], feedback: 'Which clause collapses rows per name?' },
      ],
    },
    preset: { checked: { kw: 'inner', g: 'group' } },
  },
  {
    id: 'fill-restored',
    title: 'FillBlanks, restored (answered, no onComplete)',
    step: {
      ...base,
      id: 'fx-fill-3',
      kind: 'fillBlanks',
      language: 'sql',
      template:
        'select u.name, count(o.id)\nfrom users u\n___kw___ join orders o on o.user_id = u.id\n___g___ by u.name;',
      blanks: [
        { id: 'kw', accepted: ['left'], feedback: 'x' },
        { id: 'g', accepted: ['group'], feedback: 'y' },
      ],
    },
    restored: answered(3, { answers: { kw: 'LEFT', g: 'group' } }),
  },
  {
    id: 'fill-long',
    title: 'FillBlanks, long content',
    step: {
      ...base,
      id: 'fx-fill-4',
      kind: 'fillBlanks',
      language: 'ts',
      template:
        "const total = orders.reduce((sum, order) => sum + order.totalCents, 0) / 100; // a long trailing comment that must scroll\nconst names = users.___m___((u) => u.displayName).___j___(', ');",
      blanks: [
        { id: 'm', accepted: ['map'], feedback: 'Which array method transforms every item?' },
        { id: 'j', accepted: ['join'], feedback: 'Which method glues strings together?' },
      ],
    },
  },
  {
    id: 'sql-idle',
    title: 'sqlLab, idle (needs the sample seed)',
    step: {
      ...base,
      id: 'fx-sql-1',
      kind: 'sqlLab',
      prompt: 'Return the number of orders that have at least one item.',
      seedRef: 'default',
      starter: 'select count(*) from orders o join items i on i.order_id = o.id',
      solution: 'select count(distinct o.id) from orders o join items i on i.order_id = o.id',
      orderMatters: false,
      hints: ['Count something that is the same for all rows of one order.'],
    },
  },
  {
    id: 'sql-restored',
    title: 'sqlLab, restored as solved',
    step: {
      ...base,
      id: 'fx-sql-2',
      kind: 'sqlLab',
      prompt: 'Return the number of orders that have at least one item.',
      seedRef: 'default',
      starter: '',
      solution: 'select count(distinct o.id) from orders o join items i on i.order_id = o.id',
      orderMatters: false,
      hints: [],
    },
    restored: answered(2, {
      sql: 'select count(distinct o.id) from orders o join items i on i.order_id = o.id',
    }),
  },
  {
    id: 'sql-long',
    title: 'sqlLab, long query and prompt',
    step: {
      ...base,
      id: 'fx-sql-3',
      kind: 'sqlLab',
      prompt: `${'Find every customer whose orders were counted more than once. '.repeat(4)}\n\nUse \`group by\` and \`having\`.`,
      seedRef: 'default',
      starter: `select o.customer, count(*) as item_rows, count(distinct o.id) as orders_without_the_duplicates from orders o join items i on i.order_id = o.id group by o.customer having count(*) > 1 -- a long trailing comment`,
      solution:
        'select o.customer from orders o join items i on i.order_id = o.id group by o.customer having count(*) > 1',
      orderMatters: true,
      hints: ['One', 'Two'],
    },
  },
  {
    id: 'schema-idle',
    title: 'schemaBuilder, empty canvas',
    step: {
      ...base,
      id: 'fx-schema-1',
      kind: 'schemaBuilder',
      estSeconds: 120,
      prompt: 'Design a table for **customers**. Every customer has a key and an email.',
      looseFields: ['email', 'customer number'],
      roles: [
        { id: 'customers', label: 'the table that holds customers', kind: 'table' },
        { id: 'customerId', label: "the customer's key", kind: 'column', table: 'customers' },
        { id: 'customerEmail', label: "the customer's email", kind: 'column', table: 'customers' },
      ],
      scenarios: [
        {
          id: 'email-is-required',
          story: 'A customer without an email address is refused.',
          setupSql: [],
          probeSql: 'insert into {{customers}} ({{customerId}}) values (1)',
          expect: { kind: 'fails', sqlState: '23502' },
          hintOnFail: 'The email column accepts a missing value. Make it required.',
          misconception: 'app-validation-is-enough',
        },
      ],
      references: [
        {
          name: 'customers',
          draft: {
            tables: [
              {
                name: 'customers',
                columns: [
                  {
                    name: 'id',
                    type: 'integer',
                    nullable: false,
                    unique: false,
                    primaryKey: true,
                  },
                  {
                    name: 'email',
                    type: 'text',
                    nullable: false,
                    unique: true,
                    primaryKey: false,
                  },
                ],
              },
            ],
          },
          roles: { customers: 'customers', customerId: 'id', customerEmail: 'email' },
        },
      ],
      wrongDrafts: [],
    },
  },
  {
    id: 'unbuilt-parsons',
    title: 'Unbuilt kind shows a short notice',
    step: {
      ...base,
      id: 'fx-parsons-1',
      kind: 'parsons',
      prompt: 'Order the stages.',
      feedback: 'f',
      items: [
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
        { id: 'c', text: 'three' },
      ],
    },
  },
];
