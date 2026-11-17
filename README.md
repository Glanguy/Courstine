# Courstine

Planifie tes repas de la semaine, garde tes recettes et obtiens ta liste de courses avec les totaux déjà calculés.

Exemple : 100 g de beurre pour les crêpes + 125 g pour le gâteau = **225 g de beurre** dans la liste. Pas de quantité à acheter à calculer : la liste affiche seulement le total.

## Ce que fait l'appli

- **Accueil** : les repas des prochains jours (midi et soir), le début de la liste de courses, et deux boutons qui mènent à « Repas de la semaine » et à « Liste de courses ».
- **Menus** : la semaine du lundi au dimanche, un midi et un soir par jour. Touche un repas pour choisir ou changer la recette, ou maintiens une recette du bandeau du bas et glisse-la sur un repas (souris : clic et glisse). Tu peux aussi déplacer un repas d'un créneau à l'autre.
- **Courses** : ingrédients de tous les repas de la semaine, additionnés (g et kg, ml, cl et l se cumulent), rangés par rayon, avec cases à cocher et ajout d'articles à la main.
- **Recettes** : dossiers « Recettes salées » et « Recettes sucrées », note de 1 à 5 étoiles, favoris avec un cœur rouge, recherche, tri « Mieux notées d'abord ». Le menu ⋮ de chaque recette propose « Supprimer la recette », « Changer de dossier » et « Partager » (feuille de partage du téléphone, donc Messages, WhatsApp, etc.).

## Mettre l'appli en ligne avec GitHub Pages

Le dépôt contient un petit robot (le fichier `.github/workflows/deploy.yml`) qui décompresse le zip et met le site en ligne tout seul.

**Une seule fois, au début :**

1. Crée un dépôt public sur GitHub (par exemple `courstine`).
2. Dans le dépôt, « Add file › Create new file ». Comme nom, tape exactement `.github/workflows/deploy.yml`, colle le contenu du fichier `deploy.yml`, puis « Commit changes ».
3. Va dans **Settings › Pages**. Dans « Build and deployment », choisis la source **GitHub Actions**.

**À chaque nouvelle version :**

1. « Add file › Upload files », glisse le fichier `courstine.zip` tel quel, sans le décompresser, puis « Commit changes ». Si un zip du même nom existe déjà, il est remplacé.
2. Une à deux minutes plus tard, l'appli est à jour sur `https://TON-PSEUDO.github.io/courstine/`. Tu peux suivre l'avancement dans l'onglet **Actions** (rond vert = en ligne).

Le robot prend toujours le zip envoyé le plus récemment, que le site soit dans un dossier ou directement à la racine du zip.

## L'installer sur le téléphone

- **iPhone (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮, puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».

Une fois installée, elle s'ouvre en plein écran et fonctionne aussi sans connexion.

## Tes données

- Tout est enregistré **sur ton appareil**, dans le navigateur. Aucun compte, aucun serveur, aucun service externe, aucune police ni script chargé depuis Internet.
- Le dépôt GitHub ne contient que le code et six recettes d'exemple, jamais tes recettes ni tes menus.
- Les données ne passent pas d'un appareil à l'autre toutes seules. Pour changer de téléphone, ou en cas de doute, utilise « Sauvegarder ou restaurer mes données » en bas de l'accueil : tu télécharges un fichier, puis tu le restaures sur l'autre appareil.
- Vider les données du site dans le navigateur efface tes recettes. Pense à faire une sauvegarde de temps en temps.

## Écrire les ingrédients

Une ligne par ingrédient, la quantité d'abord :

```
100 g beurre
3 œufs
2 c. à soupe de sucre
1/2 sachet de levure
sel
```

L'appli reconnaît g, kg, ml, cl, dl, l, c. à soupe, c. à café, sachet, pincée, gousse, tranche, boîte, pot, verre, botte, bouquet, paquet, brique, feuille et branche.

Limites à connaître :
- Deux unités différentes pour le même ingrédient restent sur deux lignes (par exemple « 2 c. à soupe de sucre » et « 100 g de sucre »), parce qu'une cuillère ne se convertit pas en grammes de façon fiable. Écris le sucre toujours en grammes pour avoir un seul total.
- Une recette prévue deux fois dans la semaine compte deux fois.
- Les quantités ne s'adaptent pas au nombre de personnes : écris-les pour le nombre de parts que tu cuisines.

## Pour modifier le code

Site statique sans outil de compilation : `index.html`, `css/style.css`, `js/lib.js` (calculs), `js/store.js` (données et recettes d'exemple), `js/app.js` (écrans). Pour l'essayer chez toi : `python3 -m http.server` dans le dossier, puis ouvre `http://localhost:8000`.

Le numéro de version du cache dans `sw.js` change automatiquement à chaque mise en ligne : les téléphones prennent la mise à jour sans rien toucher.

Merci à Justine la queen pour cette super idée d'appli.
