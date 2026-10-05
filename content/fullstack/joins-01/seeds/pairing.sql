-- Tiny tables for the beTheDatabase join traces: small enough to pair by hand.
create table customers (id int primary key, name text not null);
create table orders (id int primary key, customer_id int references customers (id), item text not null);
insert into customers values (1, 'Anna'), (2, 'Boris'), (3, 'Chloe'), (4, 'Dmytro');
insert into orders values (11, 1, 'lamp'), (12, 1, 'desk'), (13, 2, 'chair'), (14, 2, 'mug'), (15, 4, 'plant');

create table people (id int primary key, name text not null, city text not null);
create table offices (id int primary key, city text not null, label text not null);
insert into people values (1, 'Olha', 'Kyiv'), (2, 'Ivan', 'Lviv'), (3, 'Mia', 'Kyiv');
insert into offices values (21, 'Kyiv', 'Podil'), (22, 'Kyiv', 'Obolon'), (23, 'Lviv', 'Centre');
