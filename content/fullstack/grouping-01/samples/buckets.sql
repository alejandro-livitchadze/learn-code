-- Docs: GROUP BY forms one bucket per distinct key and returns one row per bucket: https://www.postgresql.org/docs/current/sql-select.html#SQL-GROUPBY
-- Docs: count and the other aggregate functions: https://www.postgresql.org/docs/current/functions-aggregate.html
select customer, count(*) as n from orders group by customer order by customer;
