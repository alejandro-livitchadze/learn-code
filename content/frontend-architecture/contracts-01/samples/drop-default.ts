// Recorded from our example project (jsdom, fresh page load, nothing cached; same result in three runs).
// remote_a's Widget.tsx changed: "export function Widget" became "export function Card",
// and the line "export default Widget;" was deleted; its own bootstrap.tsx now imports Card.
// exposes still says './Widget'.
// remote_a's own typecheck passed. Only remote_a rebuilt; the host is untouched.
// The error box text is stored in parts around React's error number.
const recorded = {
  errorBox: {
    before: 'remote_a failed: Minified React error',
    errorNumber: 306,
    after: '; visit https://react.dev/errors/306?args[]=undefined&args[]= for the full message',
  },
  remoteHeadings: ['Remote b'],
};
// What does the visitor see? Error boxes (up to the first ";") and remote headings, in page order.
const { before, errorNumber } = recorded.errorBox;
console.log([`${before} #${errorNumber}`, ...recorded.remoteHeadings].join(' | '));
