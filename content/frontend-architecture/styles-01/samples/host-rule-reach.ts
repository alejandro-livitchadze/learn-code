// Model: prints the values recorded from our example project.
// The host's host.css in both runs:
//   button { border: 3px solid green; }
// Run "prefix": remote_b's rule is [data-remote='remote_b'] button { background-color: red; }.
// Run "shadow + ?inline": remote_b renders into a shadow root with its CSS in a <style> inside it.
// Recorded in Chromium: getComputedStyle border-top of remote_b's button (colors as channels).
const remoteBBorder = {
  prefix: { width: '3px', color: [0, 128, 0] },
  'shadow + ?inline': { width: '2px', color: [0, 0, 0] },
} as const;
const green = (color: readonly number[]) => color.join() === '0,128,0';
// In which run did the host's border rule stay out of remote_b's button?
const keptOut = Object.entries(remoteBBorder)
  .filter(([, border]) => !(border.width === '3px' && green(border.color)))
  .map(([run]) => run);
console.log(keptOut.join(', ') || 'neither');
