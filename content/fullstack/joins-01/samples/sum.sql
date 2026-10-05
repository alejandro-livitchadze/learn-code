select sum(o.amount) from orders o join items i on i.order_id = o.id;
