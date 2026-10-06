// Recorded from our example project (jsdom, fresh page load, nothing cached; same result in three runs).
// remote_a's config changed from exposes { './Widget': ... } to { './Card': ... }; only remote_a rebuilt.
// The host is untouched. It still renders lazy(() => import('remote_a/Widget')).
const recorded = {
  errorsShownInPage: ['remote_a failed: Module "./Widget" does not exist in container.'],
  remoteHeadings: ['Remote b'],
};
// What does the visitor see? Error boxes (first line) and remote headings, in page order.
console.log([...recorded.errorsShownInPage, ...recorded.remoteHeadings].join(' | '));
