-- Docs: https://www.postgresql.org/docs/current/sql-select.html
select id from orders where status = 'paid' order by amount desc limit 2;
