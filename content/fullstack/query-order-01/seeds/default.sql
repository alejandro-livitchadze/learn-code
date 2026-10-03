-- Docs: CREATE TABLE and INSERT are covered in https://www.postgresql.org/docs/current/ddl-basics.html and https://www.postgresql.org/docs/current/dml-insert.html
create table orders (id int primary key, customer text not null, status text not null, amount int not null);
insert into orders (id, customer, status, amount) values
  (1, 'ana', 'paid', 40),
  (2, 'bo', 'paid', 15),
  (3, 'cy', 'refunded', 60),
  (4, 'ana', 'paid', 25),
  (5, 'di', 'paid', 90),
  (6, 'bo', 'refunded', 30),
  (7, 'cy', 'paid', 10),
  (8, 'ed', 'paid', 55);
