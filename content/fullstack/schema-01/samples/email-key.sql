create table customers (id int primary key, email text not null unique, name text);
create table orders (id int primary key, customer_id int references customers (id));
insert into customers values (1, 'ada@old.example', 'Ada');
insert into orders values (1, 1);
update customers set email = 'ada@new.example' where id = 1;
select count(*) as n
from orders o
join customers c on c.id = o.customer_id
where c.email = 'ada@new.example';
