# Courstine

Planifie tes repas de la semaine, garde tes recettes et obtiens ta liste de courses avec les totaux déjà calculés.

Exemple : 100 g de beurre pour les crêpes + 125 g pour le gâteau = **225 g de beurre** dans la liste. Pas de quantité à acheter à calculer : la liste affiche seulement le total.

## Ce que fait l'appli

- **Accueil** : les repas des prochains jours (midi et soir), le début de la liste de courses, et deux boutons qui mènent à « Repas de la semaine » et à « Liste de courses ».
- **Menus** : la semaine du lundi au dimanche, un midi et un soir par jour. Touche un repas pour choisir ou changer la recette, ou maintiens une recette du bandeau du bas et glisse-la sur un repas (souris : clic et glisse). Tu peux aussi déplacer un repas d'un créneau à l'autre.
- **Courses** : une seule liste pour tout. Dès qu'un repas est placé dans le planning (aujourd'hui ou plus tard), ses ingrédients y arrivent, additionnés (g et kg, ml, cl et l se cumulent) et rangés par rayon. Retirer un repas retire ses quantités.
  - Coche un article : il descend dans « Dans le panier ». « Tout supprimer » enlève tous les articles cochés.
  - Touche un article pour changer sa quantité ou son unité, ou le supprimer.
  - Ajoute un article avec sa quantité et son unité : s'il existe déjà dans la même unité (ou g/kg, ml/l), les quantités s'additionnent.
- **Recettes** : import depuis TikTok (voir plus bas), dossiers « Recettes salées » et « Recettes sucrées », note de 1 à 5 étoiles, favoris avec un cœur rouge, recherche, tri « Mieux notées d'abord ». Le menu ⋮ de chaque recette propose « Supprimer la recette », « Changer de dossier » et « Partager » (feuille de partage du téléphone, donc Messages, WhatsApp, etc.).

## Mettre l'appli en ligne avec GitHub Pages

Le dépôt contient un petit robot (le fichier `.github/workflows/deploy.yml`) qui décompresse le zip dans le dépôt, avec les mêmes dossiers, puis met le site en ligne.

**À chaque nouvelle version :** « Add file › Upload files », glisse `courstine.zip` sans le décompresser, puis « Commit changes ». Une à deux minutes plus tard, le dépôt contient les dossiers du zip (le zip est supprimé) et l'appli est à jour sur `https://TON-PSEUDO.github.io/courstine/`. Avancement dans l'onglet **Actions**.

Le dépôt est remplacé par le contenu du zip à chaque fois (sauf `.github`) : un fichier ajouté à la main dans le dépôt est effacé au zip suivant.

## L'installer sur le téléphone

- **iPhone (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮, puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».

Une fois installée, elle s'ouvre en plein écran et fonctionne aussi sans connexion.

## Importer une recette TikTok

Dans **Recettes**, touche « Importer une recette TikTok ». Courstine lit la description de la vidéo, trouve les ingrédients, puis t'affiche la recette pour que tu la vérifies avant de l'enregistrer. Aucun compte, aucune IA, rien de payant.

Trois façons de lui donner la description :

1. **Le raccourci iPhone (le plus simple au quotidien).** À créer une fois, voir ci-dessous. Dans TikTok : Partager › « Courstine TikTok ». Puis dans Courstine : « Importer une recette TikTok » › « Coller ».
2. **Le lien.** Colle le lien de la vidéo et touche « Lire la description depuis le lien ». TikTok bloque parfois cette lecture depuis un site : dans ce cas, utilise le raccourci.
3. **À la main.** Colle ou écris la description dans la case prévue.

Les ingrédients sont trouvés quand ils sont écrits dans la description (« 200 g de pâtes », « 2 œufs »…). S'ils sont seulement dits à l'oral dans la vidéo, ajoute-les à la main sur l'écran de vérification.

### Créer le raccourci « Courstine TikTok » (une fois)

Dans l'app **Raccourcis** de l'iPhone, touche **+**, nomme le raccourci « Courstine TikTok », puis ajoute ces actions dans l'ordre (cherche-les par leur nom) :

1. **Recevoir** l'entrée depuis la **feuille de partage** (type : URL). Si on ne reçoit rien : **Arrêter et répondre**.
2. **Développer l'URL** : Entrée du raccourci. *(transforme les liens courts vm.tiktok.com)*
3. **Encoder en URL** : URL développée. *(action « URL Encode »)*
4. **Texte** : `https://www.tiktok.com/oembed?url=` suivi de la variable « Texte encodé ».
5. **Obtenir le contenu de l'URL** : Texte.
6. **Obtenir la valeur du dictionnaire** : clé `title`, dans « Contenu de l'URL ».
7. **Texte** : la variable « URL développée », un retour à la ligne, puis la variable « Valeur du dictionnaire ».
8. **Copier dans le presse-papiers** : Texte.
9. **Afficher une notification** : « Recette copiée : ouvre Courstine › Importer › Coller ».

Le raccourci envoie seulement le lien de la vidéo à TikTok, sans compte ni information personnelle. Si TikTok change un jour sa façon de répondre, l'étape 6 renverra une valeur vide : colle alors la description à la main.

## Tes données

- Tout est enregistré **sur ton appareil**, dans le navigateur. Aucun compte, aucun serveur, aucune police ni script chargé depuis Internet. Seule exception : le bouton « Lire la description depuis le lien » envoie le lien de la vidéo à TikTok, et rien d'autre.
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
- Une recette prévue deux fois compte deux fois.
- Si tu changes l'unité d'un article venant d'une recette (par exemple « 3 œufs » en « 1 boîte »), il devient un ajout à la main : retirer le repas ne le retire plus.
- Les quantités ne s'adaptent pas au nombre de personnes : écris-les pour le nombre de parts que tu cuisines.

## Pour modifier le code

Site statique sans outil de compilation : `index.html`, `css/style.css`, `js/lib.js` (calculs), `js/store.js` (données et recettes d'exemple), `js/app.js` (écrans). Pour l'essayer chez toi : `python3 -m http.server` dans le dossier, puis ouvre `http://localhost:8000`.

Le numéro de version du cache dans `sw.js` change automatiquement à chaque mise en ligne : les téléphones prennent la mise à jour sans rien toucher.

Merci à Justine la queen pour cette super idée d'appli.
