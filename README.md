# 🖥️ Console Linux Klaynight (CLK)

<div align="center">

![Console Linux Web](https://img.shields.io/badge/Console-Linux%20Web-blue?style=for-the-badge&logo=linux)
![Version](https://img.shields.io/badge/Version-2.4.4-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)

**Un émulateur de terminal Linux interactif et moderne dans votre navigateur**

[🚀 Demo en direct](#-démo-en-ligne) • [📖 Documentation](#-documentation) • [🐛 Signaler un bug](https://github.com/Klaynight-dev/web_linux_console/issues) • [💡 Demander une fonctionnalité](https://github.com/Klaynight-dev/web_linux_console/issues)

![Console Linux Web](./contents/img/logo.svg)

</div>

---

## ✨ Aperçu

Console Linux Web (CLK) est une console Linux interactive entièrement développée en JavaScript qui permet d'explorer les commandes Unix/Linux directement dans votre navigateur ! Conçue pour l'apprentissage, la démonstration et le divertissement, elle offre une expérience utilisateur riche avec plus de 50 commandes implémentées.

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

Essayez la console directement : [Demo Live](http://console.klaynight.fr/)

## 📥 Installation

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/Klaynight-dev/web_linux_console.git

# Naviguer dans le dossier
cd web_linux_console

# Ouvrir dans un serveur web local
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: PHP
php -S localhost:8000
```

### Option 2 : Téléchargement direct
Téléchargez et décompressez l'archive depuis les [releases](https://github.com/Klaynight-dev/web_linux_console/releases).

## 🚀 Utilisation

1. Ouvrez `index.html` dans votre navigateur (ou http://localhost:8000)
2. La console se lance automatiquement
3. Tapez `help` pour voir toutes les commandes disponibles
4. Commencez à explorer !

### 🎯 Commandes essentielles pour débuter

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

## 📖 Documentation

### 🗂️ Commandes par catégorie

<details>
<summary><strong>🧭 Navigation</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `pwd` | Affiche le répertoire courant | `pwd` |
| `cd` | Change de répertoire | `cd /home/user` |
| `ls` | Liste le contenu | `ls -l` |
| `tree` | Arborescence des dossiers | `tree -L 2` |

</details>

<details>
<summary><strong>📁 Fichiers & Dossiers</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `cat` | Affiche le contenu d'un fichier | `cat fichier.txt` |
| `mkdir` | Crée un dossier | `mkdir nouveau_dossier` |
| `touch` | Crée un fichier vide | `touch fichier.txt` |
| `rm` | Supprime un fichier/dossier | `rm fichier.txt` |
| `edit` | Édite un fichier | `edit mon_fichier.txt` |
| `cp` | Copie un fichier/dossier | `cp source dest` |
| `mv` | Déplace/renomme | `mv ancien nouveau` |
| `find` | Recherche des fichiers | `find . -name "*.txt"` |

</details>

<details>
<summary><strong>🛠️ Utilitaires</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `echo` | Affiche du texte | `echo "Hello World"` |
| `clear` | Efface la console | `clear` |
| `help` | Affiche l'aide | `help` |
| `man` | Pages de manuel | `man ls` |
| `grep` | Recherche dans un fichier | `grep "motif" fichier.txt` |
| `wc` | Compte lignes/mots/caractères | `wc -l fichier.txt` |
| `date` | Affiche la date | `date` |

</details>

<details>
<summary><strong>⚙️ Système & Processus</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `ps` | Liste les processus | `ps aux` |
| `top` | Processus en temps réel | `top` |
| `free` | Utilisation mémoire | `free -h` |
| `df` | Espace disque | `df -h` |
| `lshw` | Informations matérielles | `lshw` |
| `whoami` | Utilisateur actuel | `whoami` |
| `uptime` | Temps de fonctionnement | `uptime` |
| `kill` | Termine un processus | `kill PID` |
| `sudo` | Exécute en tant qu'admin | `sudo command` |

</details>

<details>
<summary><strong>🌐 Réseau</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `ifconfig` | Configuration réseau | `ifconfig` |
| `ping` | Test de connectivité | `ping google.com` |
| `wget` | Télécharge un fichier | `wget https://example.com/file.txt` |
| `curl` | Transfert de données | `curl -I https://google.com` |

</details>

<details>
<summary><strong>🎮 Divertissement</strong></summary>

| Commande | Description | Exemple |
|----------|-------------|---------|
| `cowsay` | Vache qui parle | `cowsay "Hello!"` |
| `figlet` | Texte ASCII art | `figlet "HELLO"` |
| `fortune` | Citation aléatoire | `fortune` |
| `cmatrix` | Effet Matrix | `cmatrix` |

</details>

### 🎯 Exemples d'utilisation

#### Navigation et gestion de fichiers
```bash
pwd                           # Affiche le répertoire courant
ls -l                        # Liste détaillée des fichiers
mkdir projets                # Crée un dossier "projets"
cd projets                   # Entre dans le dossier
touch readme.md              # Crée un fichier readme.md
edit readme.md               # Édite le fichier
cp readme.md backup.md       # Copie le fichier
```

#### Recherche et manipulation de texte
```bash
find . -name "*.txt"         # Trouve tous les fichiers .txt
grep "hello" mon_fichier.txt # Recherche "hello" dans le fichier
wc -l mon_fichier.txt        # Compte les lignes du fichier
```

#### Commandes système
```bash
ps aux                       # Liste les processus
free -h                      # Affiche l'utilisation mémoire
df -h                        # Affiche l'espace disque
lshw                         # Informations matérielles
ifconfig                     # Configuration réseau
```

#### Divertissement
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

1. **Définir la commande** dans `contents/js/app.js` :

```javascript
commands: {
  // ... autres commandes
  maCommande(args) {
    // Traitement des arguments
    const options = this.parseOptions(args, {
      'h': 'help',
      'v': 'verbose'
    });
    
    // Logique de la commande
    this.addOutput('Résultat de ma commande');
  }
}
```

2. **Ajouter les métadonnées** dans `contents/js/cmdList.js` :

```javascript
const COMMAND_METADATA = {
  // ... autres métadonnées
  maCommande: {
    category: 'Utilitaires',
    description: 'Description de ma commande',
    synopsis: 'maCommande [options]',
    helpOption: "[options]",
    options: [
      '-h : affiche l\'aide',
      '-v : mode verbeux'
    ],
    examples: ['maCommande', 'maCommande -v']
  }
};
```

Vous pouvez aussi importer des commandes JavaScript personnalisées via le menu "Fichier > Importer du code...".

### Gestion des versions

Le projet utilise un système de versioning automatique :

```bash
# Version patch (par défaut)
node version.js add "Correction de bug"

# Version mineure
node version.js minor add "Nouvelle fonctionnalité"

# Version majeure  
node version.js major add "Refonte complète"
```

## 🔧 Configuration

### Paramètres disponibles
- **Thème** : Sombre (défaut) ou Clair
- **Police** : Monospace, Fira Mono, Consolas, Courier New, Roboto Mono
- **Taille de police** : 12px à 24px
- **Arrière-plan** : Couleur unie ou image personnalisée
- **Historique** : Taille configurable (10-200 commandes)

Accédez aux paramètres via "Outils > Paramètres" ou tapez `settings` dans la console.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. **Committez** vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. **Poussez** vers la branche (`git push origin feature/ma-fonctionnalite`)
5. **Ouvrez** une Pull Request

### Types de contributions recherchées
- 🐛 Correction de bugs
- ✨ Nouvelles commandes
- 📚 Amélioration de la documentation
- 🎨 Améliorations de l'interface
- 🔧 Optimisations de performance

### Règles de contribution
- 📝 Documentez vos fonctionnalités
- 🧪 Testez vos modifications
- 🎨 Respectez le style de code existant
- 📖 Mettez à jour la documentation

## 📋 Roadmap

### Version 2.1.0
- [ ] Terminal multi-onglets
- [ ] Autocomplétion avancée
- [ ] Support des pipes (`|`)
- [ ] Mode plein écran

### Version 2.2.0
- [ ] Thèmes personnalisables
- [ ] Sauvegarde cloud du système de fichiers
- [ ] Support des raccourcis clavier avancés
- [ ] Éditeur vim/nano

### Version 3.0.0
- [ ] Mode multi-utilisateur
- [ ] Interface graphique file manager
- [ ] API REST pour les commandes
- [ ] Terminal web-assembly

## 🐛 Signaler un problème

Si vous rencontrez un bug ou souhaitez suggérer une amélioration :

1. Vérifiez que le problème n'existe pas déjà dans les [issues](https://github.com/Klaynight-dev/web_linux_console/issues)
2. Créez une nouvelle issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Navigateur et version utilisés
   - Captures d'écran si pertinentes

## 🛠️ Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Framework CSS** : Tailwind CSS
- **Polices** : Google Fonts (Inter, Roboto Mono)
- **Stockage** : Cookies pour la persistance
- **APIs** : WebRTC, Navigator APIs pour les informations système

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Klaynight**
- GitHub: [@Klaynight-dev](https://github.com/Klaynight-dev)
- Projet: [Console Linux Web](https://github.com/Klaynight-dev/web_linux_console)

## 🙏 Remerciements

- Inspiré par les vrais terminaux Linux/Unix
- Utilise [Tailwind CSS](https://tailwindcss.com/) pour le styling
- Polices de [Google Fonts](https://fonts.google.com/)
- Communauté open source
- Contributeurs du projet

## 📊 Statistiques

![GitHub stars](https://img.shields.io/github/stars/Klaynight-dev/web_linux_console?style=social)
![GitHub forks](https://img.shields.io/github/forks/Klaynight-dev/web_linux_console?style=social)
![GitHub issues](https://img.shields.io/github/issues/Klaynight-dev/web_linux_console)
![GitHub license](https://img.shields.io/github/license/Klaynight-dev/web_linux_console)

---

<div align="center">

**⭐ N'hésitez pas à mettre une étoile si ce projet vous plaît ! ⭐**

<p>Fait avec ❤️ par <a href="https://github.com/Klaynight-dev">Klaynight</a></p>

[🏠 Retour en haut](#-console-linux-web-clk)

</div>
