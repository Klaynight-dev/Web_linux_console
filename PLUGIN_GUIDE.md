# Guide de Création de Plugins JavaScript pour Console Linux

## Méthodes d'Installation

### 1. Via le Dossier Plugins (Permanent)

Créez un dossier dans `plugins/` avec la structure suivante :

```
plugins/
└── mon-plugin/
    ├── manifest.json
    ├── index.js
    ├── commands/           (optionnel - sous-dossier pour les commandes)
    │   ├── command1.js
    │   └── command2.js
    ├── utils/              (optionnel - sous-dossier pour les utilitaires)
    │   ├── helpers.js
    │   └── validators.js
    ├── lib/                (optionnel - sous-dossier pour les bibliothèques)
    │   └── mylib.js
    └── README.md           (optionnel)
```

### 2. Via Import Direct (Temporaire/Permanent)

Utilisez la commande `import-plugin` dans la console :

1. Tapez `import-plugin`
2. Collez votre code JavaScript
3. Tapez `END_PLUGIN` pour terminer
4. Optionnel : `save-plugin <nom>` pour sauvegarder définitivement

## Structure d'un Plugin

Un plugin peut être organisé dans un dossier avec différents niveaux de complexité :

### Structure Simple
```
plugins/
└── mon-plugin/
    ├── manifest.json
    ├── index.js
    └── README.md (optionnel)
```

### Structure Modulaire (Recommandée pour les gros plugins)
```
plugins/
└── mon-plugin-avance/
    ├── manifest.json
    ├── index.js              # Point d'entrée principal
    ├── commands/             # Dossier pour organiser les commandes
    │   ├── file-commands.js  # Commandes de gestion de fichiers
    │   ├── sys-commands.js   # Commandes système
    │   └── net-commands.js   # Commandes réseau
    ├── utils/                # Dossier pour les utilitaires
    │   ├── validators.js     # Fonctions de validation
    │   ├── formatters.js     # Fonctions de formatage
    │   └── helpers.js        # Fonctions d'aide
    ├── lib/                  # Bibliothèques tierces ou personnalisées
    │   ├── api-client.js     # Client API
    │   └── config.js         # Configuration
    ├── data/                 # Données statiques (optionnel)
    │   └── templates.json
    └── README.md
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

## Organisation Modulaire des Plugins

### Fichier index.js Principal

Le fichier `index.js` sert de point d'entrée et peut importer des modules depuis les sous-dossiers :

```javascript
// index.js - Point d'entrée principal
const fileCommands = require('./commands/file-commands');
const sysCommands = require('./commands/sys-commands');
const { validateInput } = require('./utils/validators');
const { formatOutput } = require('./utils/formatters');

// Export de toutes les commandes
module.exports = {
    ...fileCommands,
    ...sysCommands
};
```

### Exemple de Sous-fichier de Commandes

```javascript
// commands/file-commands.js
const fs = require('fs');
const path = require('path');
const { validatePath } = require('../utils/validators');
const { formatFileList } = require('../utils/formatters');

const listFiles = {
    name: 'list-files',
    description: 'Liste les fichiers d\'un répertoire',
    usage: 'list-files [chemin]',
    execute: (args) => {
        const targetPath = args[0] || '.';
        
        if (!validatePath(targetPath)) {
            return 'Chemin invalide';
        }
        
        try {
            const files = fs.readdirSync(targetPath);
            return formatFileList(files);
        } catch (error) {
            return `Erreur: ${error.message}`;
        }
    }
};

const readFile = {
    name: 'read-file',
    description: 'Lit le contenu d\'un fichier',
    usage: 'read-file <fichier>',
    execute: (args) => {
        if (args.length === 0) {
            return 'Usage: read-file <fichier>';
        }
        
        try {
            return fs.readFileSync(args[0], 'utf8');
        } catch (error) {
            return `Erreur: ${error.message}`;
        }
    }
};

module.exports = {
    'list-files': listFiles,
    'read-file': readFile
};
```

### Exemple de Fichier Utilitaires

```javascript
// utils/validators.js
const fs = require('fs');
const path = require('path');

function validatePath(inputPath) {
    try {
        // Vérifie si le chemin existe
        return fs.existsSync(inputPath);
    } catch (error) {
        return false;
    }
}

function validateNumber(input) {
    const num = parseFloat(input);
    return !isNaN(num) && isFinite(num);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = {
    validatePath,
    validateNumber,
    validateEmail
};
```

```javascript
// utils/formatters.js
function formatFileList(files) {
    return files
        .map((file, index) => `${index + 1}. ${file}`)
        .join('\n');
}

function formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR');
}

module.exports = {
    formatFileList,
    formatSize,
    formatDate
};
```

### Exemple de Bibliothèque Personnalisée

```javascript
// lib/api-client.js
const https = require('https');

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async get(endpoint) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }
}

module.exports = { ApiClient };
```

```javascript
// lib/config.js
const fs = require('fs');
const path = require('path');

class Config {
    constructor(configPath) {
        this.configPath = configPath;
        this.data = this.load();
    }
    
    load() {
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return {};
        }
    }
    
    get(key, defaultValue = null) {
        return this.data[key] || defaultValue;
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save();
    }
    
    save() {
        fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2));
    }
}

module.exports = { Config };
```

## Exemple Complet avec Structure Modulaire

### manifest.json
```json
{
    "name": "Gestionnaire de Fichiers Avancé",
    "version": "2.0.0",
    "description": "Plugin complet de gestion de fichiers avec utilitaires",
    "author": "Développeur Pro",
    "main": "index.js",
    "commands": ["list-files", "read-file", "search-files", "file-info"]
}
```

### index.js
```javascript
// Point d'entrée principal qui importe tous les modules
const fileCommands = require('./commands/file-commands');
const searchCommands = require('./commands/search-commands');

// Export de toutes les commandes
module.exports = {
    ...fileCommands,
    ...searchCommands
};
```

### commands/search-commands.js
```javascript
const fs = require('fs');
const path = require('path');
const { validatePath } = require('../utils/validators');

const searchFiles = {
    name: 'search-files',
    description: 'Recherche des fichiers par nom',
    usage: 'search-files <pattern> [répertoire]',
    execute: (args) => {
        if (args.length === 0) {
            return 'Usage: search-files <pattern> [répertoire]';
        }
        
        const pattern = args[0];
        const searchDir = args[1] || '.';
        
        if (!validatePath(searchDir)) {
            return 'Répertoire invalide';
        }
        
        try {
            const files = fs.readdirSync(searchDir);
            const matches = files.filter(file => 
                file.toLowerCase().includes(pattern.toLowerCase())
            );
            
            return matches.length > 0 
                ? `Fichiers trouvés:\n${matches.join('\n')}`
                : 'Aucun fichier trouvé';
        } catch (error) {
            return `Erreur: ${error.message}`;
        }
    }
};

module.exports = {
    'search-files': searchFiles
};
```

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

## API de la Console Disponible pour les Plugins

Les plugins ont accès à plusieurs fonctions utilitaires de la console :

### `console` (Global)
```javascript
// Affichage coloré dans la console
console.log('Message normal');
console.error('Message d\'erreur en rouge');
console.warn('Message d\'avertissement en jaune');
console.info('Message d\'information en cyan');
```

### `print(message, color)` (Global)
```javascript
// Affiche un message avec une couleur spécifique
print('Texte en vert', 'green');
print('Texte en rouge', 'red');
print('Texte en bleu', 'blue');
print('Texte en jaune', 'yellow');
print('Texte en magenta', 'magenta');
print('Texte en cyan', 'cyan');
print('Texte en blanc', 'white');
```

### `clearConsole()` (Global)
```javascript
// Efface l'écran de la console
clearConsole();
```

### `getCommand(name)` (Global)
```javascript
// Récupère une commande existante
const lsCommand = getCommand('ls');
if (lsCommand) {
    // Utilise la commande
    const result = lsCommand.execute([]);
}
```

### `executeCommand(commandLine)` (Global)
```javascript
// Exécute une commande comme si elle était tapée dans la console
const result = await executeCommand('ls -la');
return result;
```

### `getWorkingDirectory()` (Global)
```javascript
// Récupère le répertoire de travail actuel
const currentDir = getWorkingDirectory();
return `Répertoire actuel: ${currentDir}`;
```

### `setWorkingDirectory(path)` (Global)
```javascript
// Change le répertoire de travail
try {
    setWorkingDirectory('/home/user');
    return 'Répertoire changé avec succès';
} catch (error) {
    return `Erreur: ${error.message}`;
}
```

### `getHistory()` (Global)
```javascript
// Récupère l'historique des commandes
const history = getHistory();
return history.slice(-10).join('\n'); // Affiche les 10 dernières commandes
```

### `addToHistory(command)` (Global)
```javascript
// Ajoute une commande à l'historique
addToHistory('ma-commande personnalisée');
```

### `prompt(message)` (Global)
```javascript
// Demande une saisie utilisateur (asynchrone)
execute: async (args) => {
    const nom = await prompt('Quel est votre nom ? ');
    return `Bonjour ${nom} !`;
}
```

### `confirm(message)` (Global)
```javascript
// Demande une confirmation oui/non (asynchrone)
execute: async (args) => {
    const confirmation = await confirm('Êtes-vous sûr ? (o/n)');
    return confirmation ? 'Confirmé !' : 'Annulé.';
}
```

### Exemple d'utilisation de l'API

```javascript
const monPlugin = {
    name: 'demo-api',
    description: 'Démontre l\'utilisation de l\'API console',
    usage: 'demo-api [action]',
    execute: async (args) => {
        const action = args[0] || 'help';
        
        switch (action) {
            case 'clear':
                clearConsole();
                return 'Console effacée !';
                
            case 'pwd':
                return `Répertoire actuel: ${getWorkingDirectory()}`;
                
            case 'history':
                const history = getHistory();
                return `Dernières commandes:\n${history.slice(-5).join('\n')}`;
                
            case 'prompt':
                const nom = await prompt('Votre nom: ');
                return `Bonjour ${nom}!`;
                
            case 'confirm':
                const ok = await confirm('Continuer?');
                return ok ? 'Vous avez confirmé' : 'Vous avez annulé';
                
            case 'colors':
                print('Rouge', 'red');
                print('Vert', 'green');
                print('Bleu', 'blue');
                return 'Démonstration des couleurs terminée';
                
            case 'exec':
                const result = await executeCommand('ls');
                return `Résultat de ls:\n${result}`;
                
            default:
                return `Actions disponibles: clear, pwd, history, prompt, confirm, colors, exec`;
        }
    }
};

module.exports = { 'demo-api': monPlugin };
```

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
4. **Structure** : Organisez en sous-fichiers pour les gros plugins
5. **Partage** : Le plugin est maintenant dans le dossier `plugins/`

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
