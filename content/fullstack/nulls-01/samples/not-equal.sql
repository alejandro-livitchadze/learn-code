-- Docs: NULL <> 'Kyiv' is unknown, and WHERE drops unknown rows: https://www.postgresql.org/docs/current/functions-comparison.html
select name from customers where city <> 'Kyiv' order by id;
