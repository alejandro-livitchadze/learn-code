// Recorded from our routing variant. On /orders the remote also renders
// <Link to="/42">Order 42 (absolute)</Link>. The visitor clicks it.
const afterClick = {
  pathname: '/42',
  mainArea: 'Shell: page not found',
};
// What does the main area show after the click?
console.log(afterClick.mainArea);
