// remote_a: changes the URL, then says so
history.pushState(null, '', '?sort=price');
window.dispatchEvent(new CustomEvent('url:changed'));

// remote_b: listens for both
window.addEventListener('popstate', onPop);
window.addEventListener('url:changed', onPop);
