-- Wave 1: Payments ledger for the Moyasar integration.
--
-- A row is created when a payment is initiated (create-payment edge function)
-- and updated by the verified webhook (the sole authority for 'paid'). Bookings
-- keep their payment_status/payment_reference; this table is the audit trail of
-- attempts and provider ids.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.package_bookings(id) on delete cascade,
  provider text not null default 'moyasar',
  provider_invoice_id text,
  provider_payment_id text,
  amount numeric(10,2) not null check (amount >= 0),
  currency char(3) not null default 'SAR',
  status text not null default 'initiated' check (status in ('initiated','paid','failed','refunded')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_provider_invoice_id on public.payments(provider_invoice_id);

alter table public.payments enable row level security;

-- Travelers can view payments for their own bookings. Writes happen only via the
-- service-role edge functions (create-payment / moyasar-webhook), which bypass RLS.
drop policy if exists "Travelers view own payments" on public.payments;
create policy "Travelers view own payments"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.package_bookings b
    where b.id = booking_id and b.traveler_id = (select auth.uid())
  ));

drop policy if exists "Admins view all payments" on public.payments;
create policy "Admins view all payments"
  on public.payments for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at_column();
