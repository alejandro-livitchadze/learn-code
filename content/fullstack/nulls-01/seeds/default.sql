-- Docs: CREATE TABLE and INSERT are covered in https://www.postgresql.org/docs/current/ddl-basics.html and https://www.postgresql.org/docs/current/dml-insert.html
-- NULL in a column means no value is known: https://www.postgresql.org/docs/current/ddl-basics.html
create table customers (id int primary key, name text not null, city text, discount int);
insert into customers (id, name, city, discount) values
  (1, 'ana', 'Kyiv', 10),
  (2, 'bo', 'Lviv', null),
  (3, 'cy', null, 0),
  (4, 'di', 'Kyiv', null),
  (5, 'ed', 'Lviv', 5),
  (6, 'fay', null, null);
