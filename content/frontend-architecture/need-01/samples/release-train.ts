// Toy model, not a tool: one shared artifact ships when every team's change is ready.
const readyOnDay = { checkout: 2, search: 3, profile: 9 };
const days = Object.values(readyOnDay);
const shipsOn = Math.max(...days);
console.log(`checkout ships on day ${shipsOn}`);
