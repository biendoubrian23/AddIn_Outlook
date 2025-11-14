# Icônes pour l'Add-in Outlook

Pour que l'add-in fonctionne correctement, vous devez créer les icônes suivantes dans le dossier `addin/assets/` :

## Icônes requises

- `icon-16.png` (16x16 pixels)
- `icon-32.png` (32x32 pixels)
- `icon-80.png` (80x80 pixels)
- `icon-64.png` (64x64 pixels)
- `icon-128.png` (128x128 pixels)

## Option 1 : Créer avec un outil en ligne

1. Allez sur https://favicon.io/favicon-generator/
2. Créez un logo avec le texte "AI" ou une icône de robot
3. Téléchargez les différentes tailles

## Option 2 : Utiliser des emojis

Vous pouvez utiliser un emoji de robot (🤖) et le convertir en PNG :

1. https://emoji.gg/
2. Chercher "robot"
3. Télécharger et redimensionner

## Option 3 : Images par défaut (temporaire)

Pour tester rapidement, créez des carrés colorés :

- Utilisez Paint ou n'importe quel éditeur d'images
- Créez un carré bleu (#0078d4) avec le texte "AI"
- Sauvegardez en différentes tailles

## Structure attendue

```
addin/
└── assets/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-64.png
    ├── icon-80.png
    └── icon-128.png
```

**Note** : Sans ces icônes, l'add-in fonctionnera quand même mais affichera des icônes par défaut ou des erreurs 404 dans la console.
