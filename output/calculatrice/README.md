# Calculatrice — interface graphique HTML dynamique

Une calculatrice web avec une interface **dynamique** :

- clavier **généré en JavaScript** à partir d'une configuration (facile à modifier) ;
- **aperçu du résultat en direct** pendant la saisie ;
- **historique** des calculs cliquable (réutilise un résultat précédent) ;
- support du **clavier physique** (chiffres, `+ - * / %`, `(`, `)`, `Entrée`, `Retour arrière`, `Échap`) ;
- **thème clair / sombre** mémorisé ;
- moteur de calcul **sécurisé** (sans `eval`) : tokenisation + Shunting-Yard, avec gestion des parenthèses, du moins unaire, de la puissance `^` et des erreurs (division par zéro, expression invalide…).

## Structure

```
calculatrice/
├── index.html            # Page principale
├── css/style.css         # Styles (thème sombre par défaut)
├── js/engine.js          # Moteur de calcul (navigateur + Node.js)
├── js/ui.js              # Interface dynamique (clavier, historique, clavier physique, thème)
├── server.js             # Serveur statique Node sans dépendance
├── test/engine.test.js   # Tests du moteur
└── package.json
```

## Comment lancer

Plusieurs options, de la plus simple à la plus « propre ».

### 1. Le plus simple — ouvrir le fichier

Double-cliquez sur `index.html`, ou ouvrez-le dans votre navigateur
(`Fichier → Ouvrir`). Aucune installation requise.

### 2. Avec Node.js (serveur intégré, sans dépendance)

```bash
cd calculatrice
node server.js
# puis ouvrez http://localhost:8000
```

Vous pouvez choisir un autre port : `node server.js 3000`.

### 3. Avec Python (si Node n'est pas installé)

```bash
cd calculatrice
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

### 4. Via npm (raccourcis définis dans package.json)

```bash
cd calculatrice
npm start        # équivaut à : node server.js
npm run serve    # équivaut à : python3 -m http.server 8000
```

## Lancer les tests

```bash
cd calculatrice
npm test
# ou directement :
node test/engine.test.js
```

## Personnaliser le clavier

La disposition des touches est définie dans le tableau `KEYS` au début de
`js/ui.js`. Ajoutez, retirez ou réorganisez les touches : l'interface se
régénère automatiquement.