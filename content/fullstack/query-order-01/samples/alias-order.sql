-- Docs: an output column name can be used in ORDER BY, https://www.postgresql.org/docs/current/queries-order.html
select customer, amount * 2 as doubled from orders where status = 'paid' order by doubled desc limit 3;
