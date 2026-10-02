create table orders (id int primary key, customer text not null, amount int not null);
create table items (id int primary key, order_id int not null references orders (id), sku text not null);
-- Orders 1 to 80 have four items and an amount of 20. Orders 81 to 100 are empty carts: no items, amount 0.
insert into orders select g, 'customer-' || g, case when g <= 80 then 20 else 0 end from generate_series(1, 100) g;
insert into items select g, (g - 1) / 4 + 1, 'sku-' || g from generate_series(1, 320) g;
