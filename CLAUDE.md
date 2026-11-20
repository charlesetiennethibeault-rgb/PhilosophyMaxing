# PhilosophyMaxing

Carnet de recherche personnel sur 87 philosophies (React, Vite, TypeScript, Supabase, GitHub Pages, PWA). Interface et contenu en français.

## Règles de travail
- Pour tout travail d'interface, lis et respecte `design.md`. N'invente aucune valeur (couleur, taille, espacement, rayon, durée) absente de `design.md` et de `src/styles/tokens.css`. S'il en manque une, demande.
- Ne touche pas à la logique métier, aux appels Supabase, au schéma ni aux données sans demande explicite.
- Travaille par phases, commit à la fin de chaque évolution terminée, puis lance l'application et explique ce qui a été fait.
- `RECORD_DRAWS` (`src/lib/config.ts`) est à `true` depuis le 2026-11-19 (l’utilisateur a activé la mémoire des tirages). Ne pas le remettre à `false` sans demande.
- Jamais de secret dans le code ni dans git. Clé `service_role` interdite dans le navigateur.
