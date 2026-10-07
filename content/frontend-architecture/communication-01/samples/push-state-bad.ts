// remote_a: changes the URL
history.pushState(null, '', '?sort=price');

// remote_b: listens only for popstate
window.addEventListener('popstate', onPop);
