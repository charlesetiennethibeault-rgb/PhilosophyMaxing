# design.md : PhilosophyMaxing

Source de vérité visuelle. Toute valeur utilisée dans l'interface vient d'ici (tokens dans `src/styles/tokens.css`). Aucune valeur absente de ce fichier ne s'invente : on demande.

## 1. Identité

- **Pour qui** : une seule personne, chercheuse ou chercheur autodidacte, qui explore 87 philosophies. Usage régulier, sessions longues d'écriture, sur ordinateur et téléphone.
- **Tâche principale** : tourner la roue, puis écrire sa propre note sur la case tirée.
- **Sentiment** : *atelier de chercheur*. Concret, précis, calme, au service du travail.
- **Direction** : « Parchemin romain » (voir §15) : une carte ancienne, vieux papier, gravures de Piranesi, colonnes et Table de Peutinger. Remplace l'ancien « Carnet de labo » gris-bleu ; reste : le catalogue numéroté et **l'aplat de couleur de la famille** sur la carte de résultat uniquement.
- **Évoque** : précis, posé, concret.
- **N'évoque pas** : ludique, criard. (Décoré et « d'époque » sont voulus depuis §15.)
- **Mode** : clair, parchemin (`color-scheme: light`), un seul thème. Le Carnet (§12) garde son papier kraft.

## 2. Couleurs

**Ce tableau décrit l'ancien thème gris-bleu : les valeurs en vigueur sont celles du §15 et de `tokens.css`.** Les rôles des tokens, eux, ne changent pas. Jamais de `#000` ni de `#fff` purs. ~90 % de l'écran est neutre ; la couleur est un signal.

| Token | Hex | OKLCH | Rôle |
|---|---|---|---|
| `--bg` | `#F1F3F5` | 96,3 % 0,003 248 | fond de page |
| `--surface` | `#FAFBFC` | 98,8 % 0,002 248 | champs, panneaux, carte |
| `--surface-2` | `#E7EAEE` | 93,6 % 0,006 255 | survol, zones en retrait, onglet inactif |
| `--border` | `#D3D9E0` | 88,3 % 0,012 252 | filets (séparation décorative) |
| `--control-border` | `#7B8795` | 61,8 % 0,025 252 | bordure des champs et cases (contraste ≥ 3:1) |
| `--text` | `#1B2530` | 26,0 % 0,025 251 | texte principal (14,9:1 sur surface) |
| `--text-2` | `#4F5B68` | 46,6 % 0,026 250 | texte secondaire, libellés, placeholders (6,2:1) |
| `--text-3` | `#6B7785` | 56,4 % 0,026 252 | éléments désactivés seulement (jamais un texte à lire) |
| `--brand` | `#C0451A` | 55,6 % 0,166 38 | **vermillon : actions principales et élément actif, rien d'autre** |
| `--brand-hover` | `#A93C15` | 50,6 % 0,151 38 | survol de `--brand` |
| `--brand-press` | `#923312` | 45,5 % 0,135 38 | appui de `--brand` |
| `--on-brand` | `#FBFCFD` | 99,1 % 0,002 248 | texte sur `--brand` et sur aplat (4,98:1) |

- **Accent** : la **couleur de la famille tirée** (donnée de l'utilisateur, modifiable dans Gérer → Familles), **un seul usage par écran** : l'aplat de la carte de résultat. L'aplat est la couleur de la famille assombrie (mélange avec `--text`) jusqu'à 4,5:1 contre `--on-brand` ; la logique est dans `src/lib/ui.ts` (`aplatColor`).
- **Les 9 couleurs de familles sont des données**, pas des tokens. Elles identifient du contenu (roue, repères, barres de progression) et ne décorent jamais l'interface.
- **Sujet propre** : signal ocre, toujours avec l'icône étoile et le mot « Propre à … » : `--own` `#C9962B` (parts de roue), `--own-bg` `#F5EBD0`, `--own-ink` `#5E4300` (7,8:1).
- **États réels seulement**, toujours avec un mot : `--danger` `#A4243B` (suppression, erreur), `--success` `#2B6B49` (« Enregistré », « Vérifiée »), `--warn` `#8A5A00` (« Hors ligne »).
- Fond sombre : voir §15.

## 3. Typographie

Deux familles, hébergées avec le projet (`@fontsource`).

- **IBM Plex Sans** (400, 500, 600, 700) : toute l'interface et les titres. Raison : forme d'instrument de mesure, très lisible à 14 px, chiffres tabulaires.
- **Source Serif 4** (400, 400 italique, 600) : **uniquement les mots de l'utilisateur** (notes, synthèses, réaction, aperçu Markdown). Raison : le serif signale « c'est ma parole », le reste est l'appareil.

Échelle fixe (px) : **12 · 14 · 16 · 20 · 28 · 40**.

| Usage | Taille / interligne | Police, poids |
|---|---|---|
| Légende, numéro de catalogue | 12 / 16 | Plex Sans 500, chiffres tabulaires, majuscules interdites |
| Interface (boutons, libellés, onglets, méta) | 14 / 20 | Plex Sans 500 ; boutons 600 |
| Texte courant | 16 / 24 | Plex Sans 400 ; notes en Source Serif 4 400 / 26 |
| Titre de section | 20 / 28 | Plex Sans 600 |
| Titre d'écran | 28 / 32 | Plex Sans 700 |
| Nom sur la carte de résultat | 40 / 44 (28 / 32 sous 600 px) | Plex Sans 700 |

- Largeur de ligne ≤ 65 caractères pour les textes longs (`max-width: 65ch`).
- Chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour numéros, compteurs, pourcentages, dates.
- Majuscules : interdites (aucun `text-transform: uppercase`).
- Champs : 16 px minimum sur téléphone.

## 4. Espacement

Base 4 px. Valeurs permises : **4, 8, 12, 16, 24, 32, 48, 64** (`--s-1` à `--s-8`). Serré dans un groupe (4 à 12), large entre les groupes (24 à 48). Les bordures cèdent la place à l'espace quand c'est possible.

## 5. Rayons

Par type : **contrôles (boutons, champs) 4 px · cartes et tuiles 6 px · tiroir, feuille et modale 10 px · pilule seulement pour les étiquettes (tags)**. Un enfant n'a jamais un rayon supérieur à celui de son parent.

## 6. Ombres et bordures

Presque tout est plat, séparé par des filets `--border` (1 px). Trois niveaux d'ombre, chacun en deux couches (ambiante + directe), teintés vers la teinte 250 :
- `--shadow-1` bouton survolé / éléments posés : `0 1px 1px` + `0 1px 3px` à 6–10 %.
- `--shadow-2` menu, tiroir, feuille mobile : `0 2px 4px` + `0 8px 24px` à 8–14 %.
- `--shadow-3` modale : `0 4px 8px` + `0 16px 48px` à 10–18 %.

## 7. Mouvement

- Appui : 120 ms, `transform: scale(0.97)`. Standard : 200 ms. Plafond : 300 ms.
- Courbe unique : `cubic-bezier(0.23, 1, 0.32, 1)` (`--ease`). Jamais `ease-in`.
- Seulement `transform` et `opacity` (propriétés listées, jamais `transition: all`).
- Menus, tiroir, feuille : partent de `scale(0.95)` + opacité depuis leur déclencheur ; modales centrées.
- **Un seul moment signature** : à l'arrêt de la roue, l'aplat de la carte de résultat se dévoile (opacité + `translateY(8px)` → 0, 300 ms). Le reste reste discret.
- `prefers-reduced-motion` : plus aucun déplacement, un simple fondu de 120 ms ; la roue s'arrête en 450 ms sans tours.

## 8. Composants

- **Bouton** : hauteur 40 px (44 px sur téléphone), rayon 4, texte 14/600, icône 16 px à gauche si utile, padding 0 16. *Primaire* : plein `--brand`, texte `--on-brand`, **un seul par écran**. *Secondaire* : fond `--surface`, bordure `--control-border`, texte `--text`. *Fantôme* : sans bordure, texte `--text-2`, survol `--surface-2`. *Destructif* : secondaire avec texte et icône `--danger`, jamais plein. Appui `scale(0.97)`, désactivé `--text-3` sur `--surface-2`, chargement : libellé conservé + « … ».
- **Champ** (input, select, textarea) : hauteur 40 px (44 sur téléphone), rayon 4, fond `--surface`, bordure `--control-border` 1 px, texte 16 px ; focus = anneau. Libellé 14/500 au-dessus, `--text-2`. Message d'erreur sous le champ en `--danger`, avec une icône et des mots.
- **Carte** : seulement pour un objet qu'on ouvre ou manipule seul (la carte de résultat). Fond `--surface`, bordure `--border`, rayon 6, jamais de bande colorée sur le bord, jamais imbriquée. **Carte de résultat** : l'en-tête est l'aplat de famille (rayon 6 en haut), le corps est neutre.
- **Étiquette (tag)** : pilule 24 px de haut, 12/500, fond `--surface-2`, sans bordure. L'étiquette « Propre à … » : fond `--own-bg`, texte `--own-ink`, icône étoile.
- **Statut de vérification** : **une ligne de texte discrète** « Fiche à vérifier » (`--text-2`, icône) avec l'action « Marquer comme vérifiée » ; en liste, on ne montre que l'exception « vérifiée » (icône coche `--success` + mot). Pas de pastille jaune.
- **Anneau de focus** : `:focus-visible`, contour 2 px `--text`, décalage 2 px. Jamais supprimé.
- **Onglets** : texte 14/600 ; actif = soulignement 2 px `--brand` + texte `--text` ; inactif `--text-2`. Vrais liens `<a>`.
- **Ligne de liste** : hauteur ≥ 56 px, séparée par un filet, sans carte ; numéro de catalogue à gauche (12 px tabulaire), nom 16/600, méta 14 `--text-2`, progression à droite.
- **Icônes** : une seule famille, **Lucide** (`lucide-react`), trait 1,75 px, tailles 16 px (texte) et 20 px (boutons-icônes), `currentColor`. Aucun emoji, aucun glyphe Unicode en guise d'icône.
- **Repères de famille** : 9 formes géométriques SVG (cercle, carré, triangle, losange, hexagone, croix, demi-disque, étoile à 4 branches, trèfle), `FamilyMark`, remplies de la couleur de la famille, 16 px, avec le nom de la famille écrit à côté.
- **Numéro de catalogue** : « N° 042 / 087 » (12/500, tabulaire, `--text-2`) sur la carte de résultat, la fiche et chaque ligne de liste.

## 9. Interdits

Dégradés et texte en dégradé · violet/indigo · halos, ombres colorées, verre dépoli · bande colorée sur le bord d'une carte · cartes imbriquées · points pulsés et badges sans état réel · `transition: all` · `hover:scale` généralisé · animations d'apparition sur chaque section · majuscules espacées · emojis et glyphes en guise d'icônes · Inter, Space Grotesk, Geist, Syne, Fraunces, Instrument Serif · fond crème + serif de titre + vert sauge · `#000` / `#fff` purs · `h-screen` (on utilise `100dvh`) · clichés (« Unlock », « Seamless », « sans effort », « fluide »…) · chiffres, badges ou témoignages inventés.

## 10. États obligatoires (chaque écran)

- **Vide, première utilisation** : une invitation (ce qui apparaîtra, pourquoi c'est utile) + une action principale.
- **Vide, filtre ou recherche sans résultat** : propose d'élargir ou d'effacer les filtres.
- **Chargement** : rien avant 200 ms, puis un squelette qui reproduit la mise en page finale, gardé ≥ 400 ms ; un bouton en cours garde son libellé (« Enregistrement… »).
- **Erreur** : ce qui s'est passé + comment corriger, à côté de l'élément concerné ; jamais de message technique brut.
- **Partiel** : une note vide, un thème sans synthèse, un tirage épuisé ont leur propre message.

## 11. Textes

Deuxième personne (« tu »), voix active, phrases courtes, ton posé et concret. Libellés d'action précis (« Enregistrer le code secret », pas « Valider »). Espaces insécables avant `:` `;` `?` `!` et à l'intérieur de « guillemets ». Vrais points de suspension « … ». Formats locaux (« 1 234 », « 62 % »).

## 12. Le Carnet : un vrai cahier de cuir et de papier kraft (exception voulue)

Décision de l'utilisateur, d'après deux photos de référence (carnet à spirale en papier kraft ligné ; journal de cuir cousu avec dorures et élastique) : l'onglet **Carnet** (liste, mes notes, historique, gérer), la **fiche** d'une philosophie et la **page de note** ressemblent à un cahier de notes un peu brouillon, **inscrit à la main**. C'est la seule partie qui sort du style « atelier » plat ; la roue, la comparaison et la progression gardent les sections 1 à 11.

- **Classe** : `notebook` sur le `<main>` de ces écrans ; tout le style est dans `src/styles/carnet.css`. Dans `.notebook`, les tokens neutres (`--text`, `--surface`, `--border`…) sont **redéfinis localement** avec les couleurs du papier, pour que boutons, champs et messages suivent sans règle par composant.
- **Structure** : `.cover` (couverture de cuir) > `.sheet` (page kraft). Couverture : cuir à grain, couture dorée en pointillé, coins dorés, élastique vertical, signet de ruban qui dépasse du bas. Page : kraft à fines lignes brunes tous les 32 px, spirale métallique à gauche (anneaux argentés dans des trous), tranche des pages empilées à droite et en bas (aplats décalés, pas d'ombre floue).
- **Matières** (hex ; OKLCH) :

| Token | Hex | OKLCH | Rôle |
|---|---|---|---|
| `--kraft` | `#E4CC9F` | 85,4 % 0,065 83 | page |
| `--kraft-2` | `#EEDDB7` | 90,2 % 0,053 87 | fiche bristol, champs, messages |
| `--ink` | `#2B1C12` | 24,2 % 0,030 55 | encre (10,5:1 sur kraft) |
| `--ink-2` | `#5A4129` | 39,7 % 0,051 64 | encre secondaire, bordures de champ (6,0:1) |
| `--rule` | `#8A6A44` | 54,7 % 0,067 70 | lignes de la page (décoratif) |
| `--highlight` | `#F2DE7A` | 89,6 % 0,123 98 | surligneur (texte dessus : 12:1) |
| `--leather` | `#6C3A1F` | 40,5 % 0,081 48 | couverture |
| `--leather-edge` | `#4A2713` | 31,4 % 0,061 49 | bord de couverture |
| `--stitch` | `#E0BC72` | 81,1 % 0,102 84 | couture et dorures |
| `--elastic` | `#3A3633` | 33,6 % 0,008 59 | élastique |
| `--ribbon` | `#8E2F2B` | 44,5 % 0,130 26 | signet |
| `--silver` | `#C5CCD3` | 84,2 % 0,012 248 | spirale |

  États sur kraft (texte ≥ 4,5:1) : succès `#22573A`, alerte `#6B4400`, danger `#8F1F34`. Le vermillon `--brand` reste réservé aux actions et à l'élément actif.
- **Écriture manuscrite** : **Shantell Sans** (variable ; axes poids, rebond BNCE, informalité INFM), troisième famille autorisée, réservée à ces écrans. Tout le texte du cahier est manuscrit, **y compris boutons et champs**. Échelle fixe respectée : 16 méta, 20 texte et noms, 28 titres de section, 40 titre de page ; interligne du texte de note 32 px, alignée sur les lignes.
- **Inscrit à la main** : (1) un filtre SVG « encre » (`feTurbulence` + `feDisplacementMap`, déplacement de 2 px) ondule les **titres** seulement, jamais le texte à lire ; (2) boîtes aux coins irréguliers (`border-radius` à 8 valeurs, exception à l'échelle des rayons) ; (3) soulignés, cercles et cases dessinés en SVG ; (4) légères rotations (±0,6°) et décalages (±3 px) fixes par `:nth-child` ; (5) l'encre est brun-noir, jamais un noir pur.
- **Motifs sans dégradé** : lignes, grain du papier et du cuir (bruit `feTurbulence`), anneaux de spirale, couture, coins, signet sont des **SVG**. Aucun `linear-gradient`. Les SVG recopient les couleurs du tableau (ils ne lisent pas les variables).
- **Rien n'est animé** : les rotations sont fixes ; rien à adapter pour `prefers-reduced-motion`.
- **Accessibilité inchangée** : contrastes ci-dessus, cibles ≥ 44 px sur téléphone, focus visible (contour `--text` = encre), mêmes libellés. Le grain et les motifs sont décoratifs (arrière-plans).

## 13. La roue évolue avec le temps (exception voulue)

Décision de l'utilisateur, d'après ses photos de roues alignées (meule de pierre, roue de bois pleine, roue à rayons, cerclage de fer, pneu, jante) : chaque période a sa propre roue. C'est une **illustration de contenu** : les matières ci-dessous ne sont pas des tokens d'interface et ne servent jamais à décorer le reste de l'application.

- **« Choisir son époque »** (`EraStrip`) : titre 20/700 et sous-titre 14 sur une carte (`--surface`, rayon 6) tout en haut de l'écran de la roue ; c'est **le seul réglage d'époque de la roue** (le groupe « Époque » et la plage d'années ont quitté les filtres de la roue ; un message ne subsiste que si une plage d'années déjà enregistrée reste active). Mini-roues de 80 px (64 px sur téléphone, en rangée défilante), nom 14/600, nombre 12 ; la roue choisie a une bordure `--text` et un filet `--brand` de 3 px. Si les filtres enregistrés ne correspondent à aucune roue de la frise, aucune n'est cochée.
- **Frise des roues** au-dessus de la grande roue : « Toutes » puis cinq mini-roues dans l'ordre chronologique, chacune avec son nom court et son nombre de philosophies (12/600 et 12/400, chiffres tabulaires). Contrôle `radiogroup`, flèches du clavier, cibles ≥ 44 px, élément choisi = filet `--brand` en bas (élément actif). Choisir une roue = filtrer sur ses époques ; la grande roue ne contient que ses philosophies, **dans l'ordre chronologique** (sens horaire). « Toutes » garde l'ordre habituel et la roue plate.
- **Cinq roues** : Antiquité = meule de pierre percée (31 philosophies) ; Moyen Âge = roue de bois pleine à planches, traverses clouées et trou carré (15) ; Moderne = roue de charrette, jante de bois cerclée de fer, rayons de bois, moyeu massif (15) ; XIXe = roue à rayons de fer fins tangents, jante d'acier rivetée (8) ; XXe–XXIe = pneu strié sur jante d'alliage, rayons larges, enjoliveur à cinq écrous (18). Le XXIe (une seule philosophie) partage la roue du XXe.
- **La couleur de la famille reste l'identité d'une part** : chaque part est teintée de la couleur de sa famille par-dessus la matière (opacité 0,5 pierre, 0,62 bois plein, 0,85 à 0,92 ailleurs), jamais remplacée. Sur les roues à rayons, les parts sont les « fenêtres » entre les rayons.
- **Matières** (hex, valeurs de dessin) : pierre `#B5AEA0` (ombre `#6C655A`, lumière `#E4DDCF`) ; bois `#9A6A3A` (ombre `#5B3A1E`, lumière `#C28F58`) ; fer `#4A4F56` ; acier `#8A9098` (lumière `#D7DBE0`) ; caoutchouc `#1C1E21` ; alliage `#C4C9CF` (lumière `#F1F3F5`, ombre `#7A8087`).
- **Pas de dégradé** : la matière vient d'aplats, de grain (points), de piqûres, de fils de bois et de filets clair/sombre. Les aspérités sont générées par un générateur pseudo-aléatoire à graine fixe : une même roue est toujours identique.
- **Performance** : la roue est dessinée une seule fois dans un bitmap (à chaque changement de parts, de période ou de taille), puis seulement tournée pendant le tirage.
- **Roue des sujets** : elle garde la roue de la période de la philosophie tirée ; les noms et pastilles d'état sont écrits sur les parts (contraste ≥ 4,5:1 comme avant).
- **Accessibilité** : la grande roue annonce sa période (« meule de pierre »…) ; les mini-roues sont décoratives (`aria-hidden`) et chaque bouton de la frise porte un libellé complet (période, objet, nombre de philosophies) ; aucune animation ajoutée.

## 14. Les statues de « Comparer » (illustration de contenu)

Décision de l'utilisateur : quand on compare des philosophies, chacune montre **le créateur en statue de pierre**, d'où qu'elle vienne (romaine, chinoise, indienne…), d'après ses deux exemples (un buste de marbre sur fond neutre, une statuette de pierre claire).

- **Source et licences** : photos de **Wikimedia Commons** uniquement, sous licence libre (CC0, domaine public, CC BY, CC BY-SA), copiées dans `public/statues/` (aucun lien vers un serveur extérieur à l'affichage). Chaque photo garde son **crédit visible** : auteur, licence et lien vers la page Commons, 12 px `--text-2` sous la statue. Données dans `seed/statues.json`, recherche reproductible dans `scripts/statues/`.
- **Choix** : pierre ou marbre d'abord ; à défaut, bronze, plâtre ou bois, **indiqué dans la légende**. Quand la philosophie n'a pas de créateur unique (32 sur 87), la statue est **symbolique** (un penseur emblématique, une divinité, une sculpture de la culture concernée) et la légende le dit : « Pas de créateur unique : choix symbolique ». Quand aucune photo libre n'existe, un **socle vide** est affiché avec la mention « Aucune statue libre de droits trouvée ».
- **Niche de pierre** (`StatueNiche`) : cadre en arche (le haut est un demi-cercle, le bas a le rayon des cartes, 6 px), rapport 3:4, 240 px au plus, bordure 3 px `--stone-dark`, fond `--stone`, socle en bas (9 % de la hauteur, `--stone-dark` avec filet `--stone-light`). La photo est passée en niveaux de gris (`grayscale(1)`, contraste 1,06) puis **fondue dans la niche par `mix-blend-mode: multiply`** : les fonds clairs prennent la couleur de la pierre, ce qui unifie des photos très différentes.
- **Pierre** (valeurs d'illustration) : `--stone` `#CFCBC2`, `--stone-dark` `#A39E92`, `--stone-light` `#E4E1DA`.
- **Légende** sous la niche : qui est représenté (14/600), note éventuelle (12), crédit (12). Alternative texte de l'image : « Statue de … (matière) ».
- **Performance** : photos de 640 px au plus, chargées à la demande (`loading="lazy"`), mises en cache à la première visite ; aucune n'est dans le précache de la PWA.
- **État de la collection** : 76 photos sur 87 philosophies ; 11 philosophies ont un socle vide (aucune statue libre trouvée). Photos recompressées à 640 px, JPEG, moins de 500 Ko chacune, hors précache, mises en cache à la demande (`CacheFirst`, cache `statues`).

## 15. Parchemin romain : une carte ancienne (thème unique, décision de l'utilisateur)

Demande : le site doit ressembler à une relique, une ancienne carte, une page d'histoire ; une architecture romaine impressionnante (pas forcément le Colisée) ; l'utilisateur est un philosophe romain. Pas de recréations dessinées, pas d'images enfantines : **uniquement de vraies gravures et cartes du domaine public**. Ce paragraphe **remplace** les couleurs du §2 (les rôles des tokens ne changent pas) et lève, pour ce thème, les interdits « décoré », « majuscules », et la police Plex pour l'interface.

**Palette** (contrastes : `--text` 12:1 sur `--surface`, `--text-2` 7,6:1, `--control-border` 5,5:1, `--on-brand` sur `--brand` 6,8:1) :

| Token | Hex | Rôle |
|---|---|---|
| `--bg` | `#DFCB9E` | parchemin vieilli, fond de page |
| `--surface` | `#EADBB6` | champs, panneaux, cartes |
| `--surface-2` | `#D6BF8E` | survol, retrait, jauges |
| `--border` | `#B39868` | filets |
| `--control-border` | `#6B4F32` | bordure des champs |
| `--text` / `--text-2` / `--text-3` | `#2B1C12` / `#523B26` / `#7A6347` | encre brune ; secondaire ; désactivé seulement |
| `--brand` / `-hover` / `-press` | `#8E2F2B` / `#7A2622` / `#661F1C` | rouge pompéien : actions principales |
| `--on-brand` | `#F6EBD0` | texte sur `--brand` et sur les aplats |
| `--nav-ink` / `--nav-ink-2` | `#F0E1BC` / `#CDB88A` | texte sur le bandeau de cuir (`--ink` `#2B1C12`) |
| `--success-on-dark` / `--warn-on-dark` | `#8FD0A4` / `#E7B866` | états lus sur le bandeau de cuir |
| `--own` / `--own-bg` / `--own-ink` | `#A6741A` / `#F0DCA6` / `#4E3500` | sujet propre |
| `--danger` / `--success` / `--warn` | `#8F1F34` / `#22573A` / `#6B4400` | états réels, toujours avec un mot |

`--rule` `#8A6A44` (trait de carte) vient du Carnet. Ombres : mêmes niveaux, teintées de brun (`oklch(30% 0.05 60 / …)`).

**Typographie** : **Source Serif 4** pour tout le texte (livre ancien), **Cinzel** (600, 700) en capitales gravées pour la marque, la navigation, `h1`, `h2`, le nom sur la carte de résultat, « Choisir son époque » et l'étiquette de la roue. Plex Sans n'est plus utilisée ; Shantell Sans reste celle du Carnet.

**Papier et carte** (`src/styles/roman.css`) : taches de vieillissement et grain fin (SVG `feTurbulence`), **deux plis verticaux et un pli horizontal**, **bords brûlés** (ombre intérieure brune), **double filet de carte** rentré de 8 px.

**Images réelles** (toutes du domaine public ou CC0, Wikimedia Commons ; `public/decor/`, source et licences dans `src/lib/decor.json`, recherche reproductible dans `scripts/decor/`) :
- **Table de Peutinger** (carte routière romaine) : bande de 44 px sous le bandeau de cuir de l'en-tête ;
- **colonnes** : trois découpes (chapiteau corinthien, fût, base) d'une gravure du Panthéon de Piranesi, de chaque côté de l'écran dès 900 px (56 px de large, 64 px dès 1 400 px), fondues dans le papier par `mix-blend-mode: multiply` ; le contenu est décalé, rien n'est recouvert ;
- **frise de monuments** au pied de chaque écran : sept gravures de Piranesi (Panthéon, Colisée, Temple d'Antonin et Faustine, Arc de Constantin, Colonne Trajane, Arc de Titus, Forum romain), 168 px de large (136 px sur téléphone), cadre double, légende en Cinzel, liens vers Commons ; ligne de crédit dessous ;
- cadres doubles à l'encre sur cartes et messages ; filet à losange rouge sous chaque titre d'écran.

Le Carnet (§12) ne reçoit ni cadres ni capitales : il garde son papier et son écriture à la main.
