// remote_a/src/Widget.tsx, version 2 (excerpt): the store is private
function add() {
  addItem('sku-1');
  const count = getState().cart.items.length;
  window.dispatchEvent(new CustomEvent('cart:changed', { detail: { count } }));
}
// remote_b/src/Widget.tsx (excerpt), unchanged since version 1
type CartChanged = CustomEvent<{ readonly count: number }>;
useEffect(() => {
  const onChange = (event: Event) => setCount((event as CartChanged).detail.count);
  window.addEventListener('cart:changed', onChange);
  return () => window.removeEventListener('cart:changed', onChange);
}, []);
