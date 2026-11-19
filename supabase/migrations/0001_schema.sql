-- PhilosophyMaxing : schéma initial.
-- Toutes les tables portent user_id et une politique RLS qui limite chaque ligne à auth.uid().
-- Les années avant J.-C. sont négatives ; date_label est du texte libre (« vers 300 av. J.-C. »).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Familles de couleur
create table public.families (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  color text not null,
  sort_order int not null default 0,
  primary key (user_id, id)
);

-- Les 5 thèmes
create table public.themes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  sort_order int not null default 0,
  primary key (user_id, id)
);

-- Les 87 fiches
create table public.philosophies (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  family_id text not null,
  region text not null,
  start_year int,
  end_year int,
  date_label text not null default '',
  founder text not null default '',
  actors text[] not null default '{}',
  description text not null default '',
  a_verifier boolean not null default true,
  reserve boolean not null default false,
  favorite boolean not null default false,
  tags text[] not null default '{}',
  sort_order int not null default 0,
  primary key (user_id, id),
  foreign key (user_id, family_id) references public.families (user_id, id)
);

-- Sujets communs et propres
create table public.topics (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  short text not null default '',
  scope text not null check (scope in ('common', 'own')),
  theme_id text,
  philosophy_id text,
  active boolean not null default true,
  question text not null default '',
  a_verifier boolean not null default false,
  sort_order int not null default 0,
  primary key (user_id, id),
  foreign key (user_id, theme_id) references public.themes (user_id, id),
  foreign key (user_id, philosophy_id) references public.philosophies (user_id, id) on delete cascade,
  check ((scope = 'own' and philosophy_id is not null) or (scope = 'common' and philosophy_id is null))
);

-- Une ligne par case (philosophie + sujet)
create table public.notes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  philosophy_id text not null,
  topic_id text not null,
  research text not null default '',
  sources jsonb not null default '[]'::jsonb,
  reaction text not null default '',
  status text not null default 'empty' check (status in ('empty', 'draft', 'deep')),
  favorite boolean not null default false,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, philosophy_id, topic_id),
  foreign key (user_id, philosophy_id) references public.philosophies (user_id, id) on delete cascade,
  foreign key (user_id, topic_id) references public.topics (user_id, id) on delete cascade
);
create trigger notes_updated_at before insert or update on public.notes
  for each row execute function public.set_updated_at();

-- Synthèse par thème (utilisée à partir de la phase 3)
create table public.theme_syntheses (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  philosophy_id text not null,
  theme_id text not null,
  body text not null default '',
  status text not null default 'empty' check (status in ('empty', 'draft', 'deep')),
  updated_at timestamptz not null default now(),
  primary key (user_id, philosophy_id, theme_id),
  foreign key (user_id, philosophy_id) references public.philosophies (user_id, id) on delete cascade,
  foreign key (user_id, theme_id) references public.themes (user_id, id) on delete cascade
);
create trigger theme_syntheses_updated_at before insert or update on public.theme_syntheses
  for each row execute function public.set_updated_at();

-- Historique des tirages
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('philosophy', 'topic')),
  philosophy_id text not null,
  topic_id text,
  drawn_at timestamptz not null default now()
);
create index draws_user_idx on public.draws (user_id, drawn_at desc);

-- Réglages (une ligne par utilisateur)
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  no_repeat boolean not null default true,
  only_remaining boolean not null default false,
  discovery boolean not null default false,
  sound boolean not null default true,
  last_filters jsonb not null default '{}'::jsonb,
  seeded boolean not null default false
);

-- Sécurité au niveau des lignes : chaque ligne n'est visible et modifiable que par son propriétaire.
do $$
declare t text;
begin
  foreach t in array array['families','themes','philosophies','topics','notes','theme_syntheses','draws','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "propriétaire seulement" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

grant select, insert, update, delete on all tables in schema public to authenticated;
