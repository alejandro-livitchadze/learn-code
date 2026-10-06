// orders/src/OrdersApp.tsx of our routing variant (excerpt)
export default function OrdersApp() {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path=":id" element={<OrderPage />} />
    </Routes>
  );
}
