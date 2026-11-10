-- SMARTLINK HUB: esquema inicial multi-negocio
-- Ejecuta TODO este archivo en Supabase > SQL Editor > New query.
-- La app usa la publishable/anon key; nunca pongas service_role en el navegador.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  loyalty_goal integer not null default 10 check (loyalty_goal between 2 and 50),
  loyalty_reward text not null default 'Una bebida gratis',
  created_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (business_id,user_id),
  unique (user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text not null,
  stamps integer not null default 0 check (stamps >= 0 and stamps <= 50),
  created_at timestamptz not null default now(),
  unique (business_id,phone)
);

create index if not exists products_business_idx on public.products(business_id);
create index if not exists customers_business_idx on public.customers(business_id);

-- Comprueba la pertenencia del usuario al negocio.
create or replace function public.is_business_member(target_business uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;

-- Alta segura del primer negocio del usuario autenticado.
create or replace function public.create_my_business(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if length(trim(coalesce(p_name,''))) < 2 then
    raise exception 'El nombre debe tener al menos 2 caracteres.';
  end if;
  if p_slug !~ '^[a-z0-9-]{3,50}$' then
    raise exception 'El identificador debe tener entre 3 y 50 caracteres y usar letras minúsculas, números o guiones.';
  end if;
  if exists (select 1 from public.business_members where user_id = auth.uid()) then
    raise exception 'Esta cuenta ya tiene un negocio asociado.';
  end if;

  insert into public.businesses(name,slug)
  values (trim(p_name),p_slug)
  returning id into new_business_id;

  insert into public.business_members(business_id,user_id,role)
  values (new_business_id,auth.uid(),'owner');

  return new_business_id;
end;
$$;

revoke all on function public.create_my_business(text,text) from public;
grant execute on function public.create_my_business(text,text) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;

-- El público puede consultar la información básica de un negocio para mostrar su menú.
drop policy if exists "public can read businesses" on public.businesses;
create policy "public can read businesses" on public.businesses
for select to anon, authenticated using (true);

-- Solo miembros pueden consultar la membresía de su propio negocio.
drop policy if exists "members read own membership" on public.business_members;
create policy "members read own membership" on public.business_members
for select to authenticated using (user_id = (select auth.uid()));

-- Menú público: solo productos disponibles. Miembros pueden ver todos y modificarlos.
drop policy if exists "public read available products" on public.products;
create policy "public read available products" on public.products
for select to anon, authenticated
using (is_available = true or public.is_business_member(business_id));

drop policy if exists "members insert products" on public.products;
create policy "members insert products" on public.products
for insert to authenticated with check (public.is_business_member(business_id));

drop policy if exists "members update products" on public.products;
create policy "members update products" on public.products
for update to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "members delete products" on public.products;
create policy "members delete products" on public.products
for delete to authenticated using (public.is_business_member(business_id));

-- Datos personales de clientes: solo el equipo autorizado del negocio puede acceder.
drop policy if exists "members read customers" on public.customers;
create policy "members read customers" on public.customers
for select to authenticated using (public.is_business_member(business_id));

drop policy if exists "members insert customers" on public.customers;
create policy "members insert customers" on public.customers
for insert to authenticated with check (public.is_business_member(business_id));

drop policy if exists "members update customers" on public.customers;
create policy "members update customers" on public.customers
for update to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "members delete customers" on public.customers;
create policy "members delete customers" on public.customers
for delete to authenticated using (public.is_business_member(business_id));

grant select on public.businesses to anon, authenticated;
grant select on public.business_members to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.customers to authenticated;

-- Permite que la cuenta recién creada consulte el negocio que acaba de registrar.

-- =====================================================================
-- ACTUALIZACIÓN v3: tarjeta pública del cliente por QR + equipo del negocio
-- Es seguro volver a ejecutar este archivo completo.
-- =====================================================================

-- Código secreto e imposible de adivinar para cada cliente (va dentro del QR).
alter table public.customers
  add column if not exists qr_token text not null default encode(gen_random_bytes(18), 'hex');
create unique index if not exists customers_qr_token_idx on public.customers(qr_token);

-- Tarjeta del cliente: se consulta SOLO con su código secreto.
-- No devuelve teléfono ni ningún dato de otros clientes.
create or replace function public.get_customer_card(p_token text)
returns table (
  customer_name text,
  stamps integer,
  loyalty_goal integer,
  loyalty_reward text,
  business_name text,
  business_slug text
)
language sql
security definer
set search_path = public
stable
as $$
  select c.full_name, c.stamps, b.loyalty_goal, b.loyalty_reward, b.name, b.slug
  from public.customers c
  join public.businesses b on b.id = c.business_id
  where c.qr_token = p_token
  limit 1;
$$;

revoke all on function public.get_customer_card(text) from public;
grant execute on function public.get_customer_card(text) to anon, authenticated;

-- Lista el equipo del negocio del usuario autenticado.
create or replace function public.list_business_members()
returns table (email text, role text)
language sql
security definer
set search_path = public, auth
stable
as $$
  select u.email::text, m.role
  from public.business_members m
  join auth.users u on u.id = m.user_id
  where m.business_id = (
    select business_id from public.business_members where user_id = auth.uid()
  )
  order by m.created_at;
$$;

revoke all on function public.list_business_members() from public;
grant execute on function public.list_business_members() to authenticated;

-- Agrega a un socio (que ya creó su cuenta en /admin) al negocio del dueño.
create or replace function public.add_business_member(p_email text, p_role text default 'owner')
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  my_business uuid;
  target_user uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if p_role not in ('owner','staff') then
    raise exception 'Rol no válido.';
  end if;

  select business_id into my_business
  from public.business_members
  where user_id = auth.uid() and role = 'owner';
  if my_business is null then
    raise exception 'Solo un dueño puede agregar personas al equipo.';
  end if;

  select id into target_user from auth.users where lower(email) = lower(trim(p_email));
  if target_user is null then
    raise exception 'Ese correo todavía no tiene cuenta. Pídele que cree su cuenta en /admin primero.';
  end if;
  if exists (select 1 from public.business_members where user_id = target_user) then
    raise exception 'Esa cuenta ya pertenece a un negocio.';
  end if;

  insert into public.business_members(business_id, user_id, role)
  values (my_business, target_user, p_role);
end;
$$;

revoke all on function public.add_business_member(text,text) from public;
grant execute on function public.add_business_member(text,text) to authenticated;
