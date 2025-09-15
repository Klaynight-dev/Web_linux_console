# Windows OS Plugin pour Console CLK

## Description
Ce plugin simule une interface graphique Windows complète qui s'intègre avec le système de fichiers de la console CLK.

## Installation
Le plugin est automatiquement détecté par la console CLK au démarrage.

## Utilisation

### Commandes disponibles
- `win` - Lance l'interface Windows
- `windows` - Alias pour la commande win

### Fonctionnalités

#### Interface Windows complète
- **Bureau** avec icônes déplaçables
- **Barre des tâches** avec bouton Démarrer et horloge
- **Menu Démarrer** avec applications
- **Fenêtres** redimensionnables et déplaçables

#### Applications intégrées
1. **Explorateur de fichiers**
   - Navigation dans le système de fichiers CLK
   - Vue des dossiers et fichiers
   - Barre d'outils avec boutons de navigation

2. **Bloc-notes**
   - Éditeur de texte simple
   - Interface Windows authentique

3. **Calculatrice**
   - Calculatrice complète avec interface graphique
   - Opérations arithmétiques de base

4. **Console CLK**
   - Accès à la console CLK intégrée
   - Retour à la console principale

#### Gestion des fenêtres
- **Déplacement** : Cliquez et glissez la barre de titre
- **Redimensionnement** : Boutons minimiser/maximiser
- **Fermeture** : Bouton X rouge
- **Focus** : Clic sur une fenêtre pour la mettre au premier plan

#### Intégration CLK
- Connexion au système de fichiers de la console
- Utilisation des API CLK disponibles
- Synchronisation avec le répertoire de travail actuel

## Structure du code

### Fichiers principaux
- `manifest.json` - Métadonnées du plugin
- `index.js` - Code principal avec l'interface Windows

### Fonctionnalités techniques
- Interface React-like en JavaScript pur
- Gestion d'état pour les fenêtres ouvertes
- Système de drag & drop complet
- Intégration avec l'API de la console CLK

## Raccourcis clavier
- **Double-clic** sur les icônes du bureau pour ouvrir les applications
- **Clic droit** (futur) pour le menu contextuel
- **Alt+Tab** (futur) pour changer de fenêtre

## Personnalisation
Le thème Windows peut être modifié en éditant les styles CSS dans le fichier `index.js`.

## Compatibilité
- Compatible avec tous les navigateurs modernes
- Utilise les API Web standards
- Responsive design pour différentes tailles d'écran

## Développement
Pour modifier le plugin :
1. Éditez le fichier `index.js`
2. Rechargez la console CLK
3. Tapez `win` pour tester les modifications

## Notes techniques
- Le plugin utilise `position: fixed` pour un affichage plein écran
- Z-index élevé (10000+) pour s'afficher au-dessus de la console
- Gestion mémoire optimisée avec nettoyage automatique
- Event listeners globaux pour la gestion des interactions

## Versions futures
- [ ] Menu contextuel (clic droit)
- [ ] Raccourcis clavier
- [ ] Thèmes personnalisables
- [ ] Plus d'applications intégrées
- [ ] Widgets du bureau
- [ ] Notifications système
