// A rule of thumb from this lesson, not a tool setting and not a law.
function pick(s: { waitsOnOtherTeams: boolean; tangledCode: boolean }): string {
  if (s.waitsOnOtherTeams) return 'microfrontends';
  return s.tangledCode ? 'modular monolith' : 'monolith';
}
console.log(pick({ waitsOnOtherTeams: true, tangledCode: false }));
