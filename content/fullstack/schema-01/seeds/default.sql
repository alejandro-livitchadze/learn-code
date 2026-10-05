create table charges (id int primary key, price_float double precision not null, price_numeric numeric(10, 2) not null);
insert into charges select g, 0.1, 0.10 from generate_series(1, 1000) g;
create table signups (id int primary key, email text);
-- Every fourth signup has no email: 5 of 20.
insert into signups select g, case when g % 4 = 0 then null else 'user' || g || '@example.com' end from generate_series(1, 20) g;
