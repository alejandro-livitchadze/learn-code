// Recorded from our example project (jsdom, fresh page load, nothing cached; same result in three runs).
// remote_a's Widget.tsx changed: "export function Widget" became "export function Card",
// and the line "export default Widget;" was deleted. exposes still says './Widget'.
// remote_a's own typecheck passed. Only remote_a rebuilt; the host is untouched.
const recorded = {
  errorsShownInPage: [
    'remote_a failed: Minified React error #306; visit https://react.dev/errors/306?args[]=undefined&args[]= for the full message',
  ],
  remoteHeadings: ['Remote b'],
};
// What does the visitor see? Error boxes (up to the first ";") and remote headings, in page order.
console.log(
  [...recorded.errorsShownInPage.map((e) => e.split(';')[0]), ...recorded.remoteHeadings].join(
    ' | ',
  ),
);
