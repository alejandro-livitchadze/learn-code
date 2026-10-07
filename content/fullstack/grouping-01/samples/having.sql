-- Docs: WHERE filters rows before grouping, HAVING filters buckets after aggregation: https://www.postgresql.org/docs/current/sql-select.html#SQL-HAVING
select customer, sum(total) as revenue
from orders
where status = 'paid'
group by customer
having sum(total) > 130
order by customer;
