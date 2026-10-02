create table orders (id int primary key, customer text not null);
create table items (id int primary key, order_id int not null references orders (id), sku text not null);
insert into orders select g, 'customer-' || g from generate_series(1, 100) g;
insert into items select g, (g - 1) / 4 + 1, 'sku-' || g from generate_series(1, 400) g;
