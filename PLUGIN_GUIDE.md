# Guide de Création de Plugins JavaScript pour Console Linux

## Méthodes d'Installation

### 1. Via le Dossier Plugins (Permanent)

Créez un dossier dans `plugins/` avec la structure suivante :

```
plugins/
└── mon-plugin/
    ├── manifest.json
    ├── index.js
    └── README.md (optionnel)
```

### 2. Via Import Direct (Temporaire/Permanent)

Utilisez la commande `import-plugin` dans la console :

1. Tapez `import-plugin`
2. Collez votre code JavaScript
3. Tapez `END_PLUGIN` pour terminer
4. Optionnel : `save-plugin <nom>` pour sauvegarder définitivement

## Structure d'un Plugin

Un plugin doit être organisé dans un dossier avec la structure suivante :

```
plugins/
└── mon-plugin/
    ├── manifest.json
    ├── index.js
    └── README.md (optionnel)
```

## Fichier Manifest (manifest.json)

Le fichier `manifest.json` décrit votre plugin :

```json
{
    "name": "Nom du Plugin",
    "version": "1.0.0",
    "description": "Description de votre plugin",
    "author": "Votre nom",
    "main": "index.js",
    "commands": ["commande1", "commande2"]
}
```

### Propriétés du Manifest

- **name** (requis) : Nom affiché du plugin
- **version** (requis) : Version du plugin (format semver)
- **description** (requis) : Description courte du plugin
- **author** (requis) : Nom de l'auteur
- **main** (requis) : Fichier principal à charger (généralement index.js)
- **commands** (requis) : Liste des noms de commandes exportées

## Structure d'une Commande JavaScript

Chaque commande doit respecter cette structure :

```javascript
const maCommande = {
    name: 'nom-commande',           // Nom de la commande (requis)
    description: 'Description',      // Description courte (requis)
    usage: 'usage exemple',         // Exemple d'utilisation (requis)
    execute: (args) => {            // Fonction d'exécution (requis)
        // args est un tableau des arguments
        return 'Résultat à afficher';
    },
    version: '1.0.0',               // Version de la commande (optionnel)
    author: 'Auteur'                // Auteur de la commande (optionnel)
};
```

### Fonction execute

- **Paramètre** : `args` - tableau des arguments passés à la commande
- **Retour** : 
  - String : texte à afficher dans la console
  - Promise<string> : pour les opérations asynchrones
  - undefined/null : n'affiche rien

## Exemple Complet

### manifest.json
```json
{
    "name": "Utilitaires Système",
    "version": "1.0.0",
    "description": "Commandes utiles pour le système",
    "author": "Communauté",
    "main": "index.js",
    "commands": ["sysinfo", "weather", "joke"]
}
```

### index.js
```javascript
const sysinfo = {
    name: 'sysinfo',
    description: 'Affiche les informations système',
    usage: 'sysinfo',
    execute: () => {
        const os = require('os');
        return `Système: ${os.type()} ${os.release()}\n` +
               `Architecture: ${os.arch()}\n` +
               `Mémoire libre: ${Math.round(os.freemem() / 1024 / 1024)} MB\n` +
               `Uptime: ${Math.round(os.uptime() / 60)} minutes`;
    }
};

const weather = {
    name: 'weather',
    description: 'Affiche une météo fictive',
    usage: 'weather [ville]',
    execute: (args) => {
        const ville = args.length > 0 ? args.join(' ') : 'Paris';
        const temperatures = [15, 18, 22, 25, 28, 20, 16];
        const conditions = ['Ensoleillé', 'Nuageux', 'Pluvieux', 'Orageux'];
        
        const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        return `Météo à ${ville}: ${temp}°C, ${condition} ☀️`;
    }
};

const joke = {
    name: 'joke',
    description: 'Raconte une blague',
    usage: 'joke',
    execute: () => {
        const jokes = [
            "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon, ils tombent dans le bateau !",
            "Que dit un escargot quand il croise une limace ? 'Regarde, un nudiste !'",
            "Comment appelle-t-on un chat tombé dans un pot de peinture ? Un chat-mallow !",
            "Que dit un informaticien quand il se noie ? F1 ! F1 ! F1 !"
        ];
        
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
};

// Export des commandes
module.exports = {
    sysinfo,
    weather,
    joke
};
```

## Exemple d'Import Direct

```javascript
// Exemple de plugin simple à importer
const hello = {
    name: 'hello',
    description: 'Dit bonjour',
    usage: 'hello [nom]',
    execute: (args) => {
        const name = args.join(' ') || 'monde';
        return `Hello ${name}!`;
    }
};

const time = {
    name: 'time',
    description: 'Affiche l\'heure actuelle',
    usage: 'time',
    execute: () => {
        return `Il est ${new Date().toLocaleTimeString()}`;
    }
};

module.exports = {
    hello,
    time
};
```

## Commandes du Système de Plugins

- `plugins` : Liste tous les plugins et commandes
- `import-plugin` : Importer un plugin depuis du code
- `save-plugin <nom>` : Sauvegarder un plugin temporaire
- `remove-temp-plugin <nom>` : Supprimer un plugin temporaire

## Flux de Travail Recommandé

1. **Test rapide** : Utilisez `import-plugin` pour tester votre code
2. **Validation** : Testez vos commandes
3. **Sauvegarde** : Utilisez `save-plugin` si le plugin fonctionne bien
4. **Partage** : Le plugin est maintenant dans le dossier `plugins/`

## Sécurité

Les plugins importés directement ont des restrictions :
- ✅ Modules autorisés : `fs`, `path`, `os`, `crypto`, `util`
- ❌ Modules interdits : `child_process`, `cluster`, etc.
- ✅ Les plugins du dossier `plugins/` n'ont pas ces restrictions

- ⚠️ **Évitez `eval()`** sauf si absolument nécessaire et avec validation stricte
- ✅ **Validez toujours les entrées utilisateur**
- ✅ **Gérez les erreurs proprement**
- ✅ **Limitez l'accès aux fichiers système sensibles**

## Débogage

Pour déboguer votre plugin :
1. Ajoutez des `console.log()` dans votre fonction execute
2. Vérifiez les erreurs dans la console
3. Testez avec différents arguments

## Bonnes Pratiques JavaScript

### Validation des Arguments
```javascript
execute: (args) => {
    if (args.length === 0) {
        return 'Usage: ma-commande <argument>';
    }
    
    const nombre = parseInt(args[0]);
    if (isNaN(nombre)) {
        return 'Erreur: L\'argument doit être un nombre';
    }
    
    // Traitement...
}
```

### Gestion d'Erreurs
```javascript
execute: (args) => {
    try {
        // Code pouvant lever une erreur
        return resultat;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}
```

### Commandes Asynchrones
```javascript
execute: async (args) => {
    try {
        const result = await maFonctionAsync();
        return `Résultat: ${result}`;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}
```

### Utilisation de Modules Node.js
```javascript
const fs = require('fs');
const path = require('path');
const https = require('https');

const maCommande = {
    name: 'lire',
    description: 'Lit un fichier',
    usage: 'lire <fichier>',
    execute: (args) => {
        if (args.length === 0) {
            return 'Usage: lire <fichier>';
        }
        
        try {
            const contenu = fs.readFileSync(args[0], 'utf8');
            return contenu;
        } catch (error) {
            return `Impossible de lire le fichier: ${error.message}`;
        }
    }
};
```
