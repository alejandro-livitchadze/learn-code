select count(*) from orders o join items i on i.order_id = o.id;
