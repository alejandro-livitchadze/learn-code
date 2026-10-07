// Recorded from our example, URL version (jsdom, fresh page load of /).
// remote_a's button:  history.pushState(null, '', '?sort=price')
// remote_b reads new URLSearchParams(location.search).get('sort') ?? 'none' on first render,
// and reads it again on every 'popstate' event.
const recorded = {
  addressAfterClick: '/?sort=price',
  remoteBText: { afterLoad: 'Sort: none', afterClick: 'Sort: none' },
};
// The visitor clicks "sort by price". What does remote_b show?
console.log(recorded.remoteBText.afterClick);
