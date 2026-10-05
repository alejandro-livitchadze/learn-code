-- Docs: https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP
select customer, sum(amount) as total from orders where status = 'paid' group by customer having sum(amount) > 30 order by total desc;
