# design.md : PhilosophyMaxing

Source de vérité visuelle. Toute valeur utilisée dans l'interface vient d'ici (tokens dans `src/styles/tokens.css`). Aucune valeur absente de ce fichier ne s'invente : on demande.

## 1. Identité

- **Pour qui** : une seule personne, chercheuse ou chercheur autodidacte, qui explore 87 philosophies. Usage régulier, sessions longues d'écriture, sur ordinateur et téléphone.
- **Tâche principale** : tourner la roue, puis écrire sa propre note sur la case tirée.
- **Sentiment** : *atelier de chercheur*. Concret, précis, calme, au service du travail.
- **Direction** : « Carnet de labo » (papier gris-bleu froid, encre, filets fins, catalogue numéroté) + **l'aplat de couleur de la famille** sur la carte de résultat uniquement.
- **Évoque** : précis, posé, concret.
- **N'évoque pas** : ludique, décoré, « bibliothèque d'époque ».
- **Mode** : clair seulement (`color-scheme: light`).

## 2. Couleurs

Neutres teintés bleu-gris (teinte OKLCH 250, chroma 0,002 à 0,026). Jamais de `#000` ni de `#fff` purs. ~90 % de l'écran est neutre ; la couleur est un signal.

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
- Fond sombre : non prévu.

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

## 12. Le Carnet : un vrai cahier (exception voulue)

Décision de l'utilisateur : l'onglet **Carnet** (liste, mes notes, historique, gérer), la **fiche** d'une philosophie et la **page de note** ressemblent à un cahier de notes un peu brouillon, écrit à la main. C'est la seule partie de l'application qui sort du style « atelier » plat ; la roue, la comparaison et la progression gardent le système des sections 1 à 11.

- **Classe** : `notebook` sur le `<main>` de ces écrans ; tout le style est dans `src/styles/carnet.css`, rien ne déborde sur les autres écrans.
- **Écriture manuscrite** : famille **Shantell Sans** (variable, hébergée via `@fontsource-variable/shantell-sans`, axes poids, « rebond » BNCE et « informalité » INFM). Raison : une écriture marqueur lisible à 16-20 px, avec tous les accents français, et un réglage « brouillon » sans changer de police. C'est la **troisième famille** autorisée, réservée à ces écrans : les mots de l'utilisateur et les titres y sont manuscrits. Les champs de formulaire de « Gérer » restent en IBM Plex Sans.
- **Tailles** : l'échelle fixe est respectée (16 méta, 20 texte et noms, 28 titres de section, 40 titre de page). Corps des notes : 20 px sur une interligne de 32 px, alignée sur les lignes de la feuille.
- **Papier** (tokens, valeurs OKLCH) :

| Token | Hex | OKLCH | Rôle |
|---|---|---|---|
| `--sheet` | `#FBFBF8` | 98,7 % 0,004 106 | feuille (jamais `#fff`) |
| `--rule` | `#BCCBE2` | 83,8 % 0,036 259 | lignes principales (bleu de cahier) |
| `--rule-fine` | `#E1E8F2` | 92,9 % 0,016 257 | carreaux |
| `--margin` | `#D77A7A` | 68,2 % 0,116 21 | double trait de marge, filet de fiche bristol |
| `--tape` | `#E6DDBF` | 89,7 % 0,041 93 | bout de ruban adhésif, étiquettes |
| `--highlight` | `#F3E58B` | 91,4 % 0,112 101 | surligneur (survol, sujet propre) ; texte dessus à 12:1 |

  L'encre reste `--text` (15:1 sur la feuille). Le vermillon `--brand` reste réservé aux actions et à l'élément actif.
- **Motifs sans dégradé** : carreaux de 32 px, trous de reliure, traits d'écriture, soulignés et cercles à la main sont des **SVG** (jamais `linear-gradient`). Les couleurs des SVG sont recopiées des tokens ci-dessus (un SVG ne lit pas les variables CSS).
- **Un peu brouillon, sans animation** : légères rotations (±0,3°) et décalages (±3 px) fixes, répartis par `:nth-child`. Rien ne bouge : la propriété `rotate` n'est jamais animée, donc rien à adapter pour `prefers-reduced-motion`.
- **Éléments** : feuille à carreaux avec double marge rouge et trous de reliure à gauche (rayon 6, ombre `--shadow-2`) ; titre manuscrit souligné d'un trait à la main ; onglet actif entouré d'un cercle gribouillé ; fiche = fiche bristol (filet rouge en haut, ruban adhésif, légère rotation) ; états des sujets = cases dessinées à la main (vide : cercle ; brouillon : cercle hachuré ; approfondi : cercle coché) ; sujet propre = étoile dessinée + surligneur ; zone d'écriture = feuille réglée avec lignes alignées sur le texte.
- **Accessibilité inchangée** : mêmes contrastes, mêmes cibles (≥ 44 px sur téléphone), même focus visible, mêmes libellés.
