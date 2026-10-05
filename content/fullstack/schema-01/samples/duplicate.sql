create table signups_log (id int primary key, email text unique);
insert into signups_log values (1, null), (2, null);
select count(*) as n from signups_log;
