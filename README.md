# 🖥️ Console Linux Web (CLK)

Une console Linux interactive entièrement développée en JavaScript qui permet d'explorer les commandes Unix/Linux directement dans votre navigateur !

![Console Linux Web](./contents/img/logo.svg)

## 🌟 Fonctionnalités

### 📁 Système de fichiers virtuel
- Navigation complète avec `cd`, `pwd`, `ls`
- Création et gestion de fichiers/dossiers (`mkdir`, `touch`, `rm`)
- Éditeur de texte riche intégré (`edit`)
- Opérations de copie/déplacement (`cp`, `mv`)

### 🛠️ Plus de 50 commandes disponibles
- **Navigation** : `pwd`, `cd`, `ls`, `tree`
- **Fichiers** : `cat`, `mkdir`, `touch`, `rm`, `edit`, `find`, `cp`, `mv`
- **Utilitaires** : `echo`, `clear`, `help`, `grep`, `wc`, `date`
- **Système** : `ps`, `top`, `free`, `df`, `kill`, `sudo`
- **Réseau** : `ping`, `wget`, `curl`, `ifconfig`, `lshw`
- **Divertissement** : `cowsay`, `figlet`, `fortune`, `cmatrix`

### 🎨 Interface personnalisable
- Thèmes sombre/clair
- Choix de polices (Monospace, Fira Mono, Consolas...)
- Taille de police ajustable
- Arrière-plan personnalisable (couleur ou image)
- Interface responsive

### 💾 Persistance des données
- Historique des commandes sauvegardé
- Système de fichiers persistant
- Paramètres utilisateur mémorisés
- Gestion des cookies et cache

### 🚀 Fonctionnalités avancées
- Import de commandes personnalisées JavaScript
- Documentation intégrée avec `man`
- Simulation Matrix avec `cmatrix`
- Intégration GitHub pour les informations du projet
- Système de pseudos utilisateur

## 🎮 Démo en ligne

Essayez la console directement : [Demo Live](https://votre-demo-url.com)

## 📥 Installation

### Option 1 : Clonage du dépôt
```bash
git clone https://github.com/Klaynight-dev/web_linux_console.git
cd web_linux_console
```

### Option 2 : Téléchargement direct
Téléchargez et décompressez l'archive depuis les [releases](https://github.com/Klaynight-dev/web_linux_console/releases).

## 🚀 Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. La console se lance automatiquement
3. Tapez `help` pour voir toutes les commandes disponibles
4. Commencez à explorer !

### Commandes essentielles pour débuter

```bash
help                    # Affiche toutes les commandes
ls                      # Liste le contenu du dossier
cd /home/user          # Navigue vers un dossier
cat welcome.txt        # Affiche le contenu d'un fichier
mkdir mon_dossier      # Crée un nouveau dossier
touch mon_fichier.txt  # Crée un nouveau fichier
edit mon_fichier.txt   # Édite un fichier
tree                   # Affiche l'arborescence
man ls                 # Manuel d'une commande
```

## 🎯 Exemples d'utilisation

### Navigation et gestion de fichiers
```bash
pwd                           # Affiche le répertoire courant
ls -l                        # Liste détaillée des fichiers
mkdir projets                # Crée un dossier "projets"
cd projets                   # Entre dans le dossier
touch readme.md              # Crée un fichier readme.md
edit readme.md               # Édite le fichier
cp readme.md backup.md       # Copie le fichier
```

### Recherche et manipulation de texte
```bash
find . -name "*.txt"         # Trouve tous les fichiers .txt
grep "hello" mon_fichier.txt # Recherche "hello" dans le fichier
wc -l mon_fichier.txt        # Compte les lignes du fichier
```

### Commandes système
```bash
ps aux                       # Liste les processus
free -h                      # Affiche l'utilisation mémoire
df -h                        # Affiche l'espace disque
lshw                         # Informations matérielles
ifconfig                     # Configuration réseau
```

### Divertissement
```bash
cowsay "Hello World!"        # Vache qui parle
figlet "ASCII ART"           # Texte en ASCII art
fortune                      # Citation aléatoire
cmatrix                      # Simulation Matrix (q pour quitter)
```

## 🛠️ Développement

### Structure du projet
```
.
├── index.html              # Page principale
├── contents/
│   ├── css/
│   │   └── styles.css      # Styles personnalisés
│   ├── js/
│   │   ├── app.js          # Application principale
│   │   └── cmdList.js      # Métadonnées des commandes
│   └── img/
│       └── logo.svg        # Logo du projet
├── version.js              # Script de gestion des versions
├── version.json            # Informations de version
└── README.md               # Documentation
```

### Ajouter des commandes personnalisées

Vous pouvez importer des commandes JavaScript personnalisées :

```javascript
// Exemple de commande personnalisée
registerCommand('hello', function(args) {
    const name = args[0] || 'World';
    this.addOutput(`Hello, ${name}!`);
});
```

Utilisez le menu "Fichier > Importer du code..." pour ajouter vos commandes.

### Gestion des versions

Le projet utilise un système de versioning automatique :

```bash
node version.js patch add "Description des changements"
node version.js minor add "Nouvelle fonctionnalité"
node version.js major add "Changement majeur"
```

## 🔧 Configuration

### Paramètres disponibles
- **Thème** : Sombre (défaut) ou Clair
- **Police** : Monospace, Fira Mono, Consolas, etc.
- **Taille de police** : 12px à 24px
- **Arrière-plan** : Couleur unie ou image personnalisée
- **Historique** : Taille configurable (10-200 commandes)

Accédez aux paramètres via "Outils > Paramètres" ou tapez `settings` dans la console.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

### Types de contributions recherchées
- 🐛 Correction de bugs
- ✨ Nouvelles commandes
- 📚 Amélioration de la documentation
- 🎨 Améliorations de l'interface
- 🔧 Optimisations de performance

## 📋 Roadmap

- [ ] Support des pipes (`|`)
- [ ] Auto-complétion des commandes
- [ ] Thèmes personnalisables
- [ ] Sauvegarde cloud du système de fichiers
- [ ] Support des raccourcis clavier avancés
- [ ] Mode multi-utilisateur
- [ ] API REST pour les commandes

## 🐛 Signaler un problème

Si vous rencontrez un bug ou souhaitez suggérer une amélioration :

1. Vérifiez que le problème n'existe pas déjà dans les [issues](https://github.com/Klaynight-dev/web_linux_console/issues)
2. Créez une nouvelle issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Navigateur et version utilisés
   - Captures d'écran si pertinentes

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Klaynight** - [GitHub](https://github.com/Klaynight-dev)

## 🙏 Remerciements

- Inspiré par les vrais terminaux Linux/Unix
- Utilise [Tailwind CSS](https://tailwindcss.com/) pour le styling
- Polices de [Google Fonts](https://fonts.google.com/)

## 📊 Statistiques

![GitHub stars](https://img.shields.io/github/stars/Klaynight-dev/web_linux_console?style=social)
![GitHub forks](https://img.shields.io/github/forks/Klaynight-dev/web_linux_console?style=social)
![GitHub issues](https://img.shields.io/github/issues/Klaynight-dev/web_linux_console)
![GitHub license](https://img.shields.io/github/license/Klaynight-dev/web_linux_console)

---

<div align="center">
  <p>Fait avec ❤️ par <a href="https://github.com/Klaynight-dev">Klaynight</a></p>
  <p>⭐ N'hésitez pas à mettre une étoile si ce projet vous plaît !</p>
</div>
