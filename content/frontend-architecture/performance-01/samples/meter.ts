// The meter, recorded from our example: one change from A at a time.
// Three fresh page loads each, 100 ms per response; medians from recording/results.json.
// [id, change, requests, bytes, rounds, remotes on screen in ms]
type Row = readonly [string, string, number, number, number, number];
const meter: readonly Row[] = [
  ['A', 'none (as built)', 12, 586465, 6, 965],
  ['B', 'remote_b shares nothing', 13, 801814, 6, 955],
  ['C', 'preloadRemote', 13, 587388, 5, 966],
  ['D', "shareStrategy 'loaded-first'", 12, 586417, 5, 732],
];
// B put an error box in remote_b's place (lesson 4), so it is out of the race.
const working = meter.filter(([id]) => id !== 'B');
let best = working[0];
for (const row of working) if (best === undefined || row[5] < best[5]) best = row;
// Which single change showed both remotes soonest?
if (best !== undefined)
  console.log(`${best[0]}, ${best[1]}: ${(working[0]?.[5] ?? 0) - best[5]} ms sooner`);
