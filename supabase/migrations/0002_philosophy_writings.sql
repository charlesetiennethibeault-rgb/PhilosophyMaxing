-- Les trois textes personnels d'une philosophie (Markdown) : synthèse, ce que j'en pense, contexte historique.
-- Aucune nouvelle table : la RLS existante de public.philosophies s'applique déjà.
alter table public.philosophies
  add column if not exists synthesis text not null default '',
  add column if not exists opinion text not null default '',
  add column if not exists context text not null default '';

-- Demande à l'API de relire le schéma tout de suite.
notify pgrst, 'reload schema';
