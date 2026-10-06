-- Docs: GROUP BY treats all NULLs of a key as one bucket: https://www.postgresql.org/docs/current/sql-select.html#SQL-GROUPBY
-- Docs: ORDER BY ASC puts NULL last by default: https://www.postgresql.org/docs/current/queries-order.html
select coupon, count(*) as n from orders group by coupon order by coupon;
