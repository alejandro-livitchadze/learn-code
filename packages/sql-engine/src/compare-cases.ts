/**
 * Pairs of a reference query and a learner query with the verdict the one result comparer must
 * give. The widget tests and the lesson checker tests both run these, so the two paths cannot drift.
 */
export interface CompareCase {
  readonly name: string;
  readonly seed: string;
  readonly solution: string;
  readonly attempt: string;
  readonly orderMatters: boolean;
  readonly match: boolean;
}

const seed =
  "create table t (id int, name text); insert into t values (1, 'a'), (2, 'b'), (2, 'b');";

export const COMPARE_CASES: readonly CompareCase[] = [
  {
    name: 'same query',
    seed,
    solution: 'select id from t',
    attempt: 'select id from t',
    orderMatters: false,
    match: true,
  },
  {
    name: 'column case differs',
    seed,
    solution: 'select id from t',
    attempt: 'select id as "ID" from t',
    orderMatters: false,
    match: true,
  },
  {
    name: 'column order differs',
    seed,
    solution: 'select id, name from t',
    attempt: 'select name, id from t',
    orderMatters: false,
    match: true,
  },
  {
    name: 'row order ignored',
    seed,
    solution: 'select id from t order by id',
    attempt: 'select id from t order by id desc',
    orderMatters: false,
    match: true,
  },
  {
    name: 'row order matters',
    seed,
    solution: 'select id from t order by id',
    attempt: 'select id from t order by id desc',
    orderMatters: true,
    match: false,
  },
  {
    name: 'duplicate rows differ',
    seed,
    solution: 'select id from t',
    attempt: 'select distinct id from t',
    orderMatters: false,
    match: false,
  },
  {
    name: 'different column name',
    seed,
    solution: 'select id from t',
    attempt: 'select id as x from t',
    orderMatters: false,
    match: false,
  },
  {
    name: 'extra column',
    seed,
    solution: 'select id from t',
    attempt: 'select id, name from t',
    orderMatters: false,
    match: false,
  },
  {
    name: 'null is not the text null',
    seed,
    solution: 'select null::text as v',
    attempt: "select 'null' as v",
    orderMatters: false,
    match: false,
  },
];
