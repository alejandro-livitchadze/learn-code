select count(*) from orders o left join items i on i.order_id = o.id;
