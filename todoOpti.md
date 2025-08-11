# To-Do Optimisations
1. Optimisation des accès DOM
Réduire les accès fréquents au DOM lors du rendu des onglets (renderTabs). Utilise des fragments (DocumentFragment) ou construit le HTML en mémoire avant d’injecter dans le DOM.
Minimiser les requêtes getElementById en stockant les références lors de l’initialisation.
1. Gestion des événements
Délégation d’événements : Plutôt que d’attacher des listeners à chaque onglet, attache-les au conteneur et utilise le ciblage (event.target).
Nettoyage des listeners lors de la suppression d’un onglet pour éviter les fuites mémoire.
1. Stockage et sérialisation
Limiter la taille de l’historique stocké dans localStorage (déjà partiellement fait avec slice(-100)).
Détecter les changements avant de sauvegarder pour éviter des écritures inutiles dans le stockage.
1. Rendu et performances
Éviter les rendus complets à chaque modification : ne re-render que l’onglet concerné ou utiliser un diff simple.
Utiliser requestAnimationFrame pour les opérations de rendu lourdes si besoin.
1. Sécurité
Échapper systématiquement le contenu HTML lors de l’injection dans le DOM pour éviter les failles XSS (déjà partiellement fait dans le renommage).
1. Refactorisation du code
Extraire des fonctions utilitaires pour la création d’éléments DOM, la gestion des cookies, etc.
Modulariser : séparer la logique de gestion d’état et la logique d’affichage.
1. Accessibilité
Améliorer l’accessibilité (ARIA, navigation clavier, focus visible, etc.).
1. Tests
Ajouter des tests unitaires pour les méthodes critiques (création, suppression, sauvegarde/restauration d’onglets).
1. Compatibilité
Vérifier la compatibilité mobile et responsive du rendu des onglets.
1.  Expérience utilisateur
Ajouter des animations légères lors de l’ajout/suppression d’onglets.
Gérer le débordement (trop d’onglets) avec un scroll horizontal ou un menu déroulant.