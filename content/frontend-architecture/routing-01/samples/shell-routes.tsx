// host/src/App.tsx of our routing variant (excerpt: nav, Suspense and error boundary left out)
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/orders/*" element={<OrdersApp />} />
        <Route path="*" element={<h1>Shell: page not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
