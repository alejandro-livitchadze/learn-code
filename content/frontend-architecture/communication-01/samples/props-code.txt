// host/src/App.tsx (excerpt): the host owns the count
const [count, setCount] = useState(0);
<RemoteA onAdd={() => setCount((c) => c + 1)} />
<RemoteB count={count} />
// remote_a/src/Widget.tsx and remote_b/src/Widget.tsx (excerpts)
export function Widget({ onAdd }: { readonly onAdd: () => void }) {
export function Widget({ count }: { readonly count: number }) {
