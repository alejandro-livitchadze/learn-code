-- Docs: NULL is not equal to 0; the comparison is unknown: https://www.postgresql.org/docs/current/functions-comparison.html
select name from customers where discount = 0 order by id;
