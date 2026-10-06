// Model of our example, props version; the printed text was recorded from the real build:
// the host keeps the count and passes it down,
//   <RemoteA onAdd={() => setCount((c) => c + 1)} />   <RemoteB count={count} />
// remote_a's button calls onAdd. The remotes import nothing from each other.
let count = 0;
const onAdd = () => {
  count = count + 1;
};
onAdd(); // the visitor clicks "add to cart" once; React renders the host again
// What does remote_b's badge show?
console.log(`Cart count: ${count}`);
