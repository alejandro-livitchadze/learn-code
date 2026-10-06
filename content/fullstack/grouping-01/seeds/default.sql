-- Docs: CREATE TABLE and INSERT are covered in https://www.postgresql.org/docs/current/ddl-basics.html and https://www.postgresql.org/docs/current/dml-insert.html
-- coupon is NULL when the order used no coupon: https://www.postgresql.org/docs/current/ddl-basics.html
create table orders (id int primary key, customer text not null, status text not null, total int not null, coupon text);
insert into orders (id, customer, status, total, coupon) values
  (1, 'ana', 'paid', 100, null),
  (2, 'ana', 'paid', 50, 'SPRING'),
  (3, 'bo', 'paid', 200, null),
  (4, 'bo', 'refunded', 200, 'SPRING'),
  (5, 'cy', 'paid', 30, null),
  (6, 'cy', 'paid', 70, 'VIP'),
  (7, 'cy', 'paid', 20, null),
  (8, 'di', 'refunded', 90, null);
