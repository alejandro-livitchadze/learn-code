-- Verified run (PGlite 0.5.8 / PostgreSQL 18.3, 2026-10-07): all NULL coupons form one group; see the source notes in lesson.mdoc
-- Docs: ORDER BY ASC puts NULL last by default: https://www.postgresql.org/docs/current/queries-order.html
select coupon, count(*) as n from orders group by coupon order by coupon;
