// Our example, props version. The host keeps the count and passes it down:
//   <RemoteA onAdd={() => setCount((c) => c + 1)} />   <RemoteB count={count} />
// remote_a's button calls onAdd. The remotes import nothing from each other.
let count = 0;
const onAdd = () => {
  count = count + 1;
};
onAdd(); // the visitor clicks "add to cart" once; React renders the host again
// What does remote_b's badge show?
console.log(`Cart count: ${count}`);
