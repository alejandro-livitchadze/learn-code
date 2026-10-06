-- Docs: count(*) counts input rows, count(expression) counts rows where the expression is not NULL: https://www.postgresql.org/docs/current/functions-aggregate.html
select count(*) as all_rows, count(coupon) as with_coupon from orders;
