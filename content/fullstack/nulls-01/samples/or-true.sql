-- Docs: unknown OR true is true (three-valued logic table): https://www.postgresql.org/docs/current/functions-logical.html
select name from customers where city = 'Kyiv' or discount = 0 order by id;
