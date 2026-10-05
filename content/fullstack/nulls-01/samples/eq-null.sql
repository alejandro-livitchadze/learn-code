-- Docs: a comparison with NULL yields NULL (unknown): https://www.postgresql.org/docs/current/functions-comparison.html
-- Docs: WHERE keeps only rows where the condition is true: https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-WHERE
select count(*) from customers where city = null;
