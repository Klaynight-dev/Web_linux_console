// --- Command Descriptions and Metadata ---
const COMMAND_METADATA = {
    // Navigation
    pwd: {
        category: 'Navigation',
        description: 'Affiche le dossier courant',
        synopsis: 'pwd',
        helpOption: "None",
        options: [],
        examples: ['pwd']
    },
    cd: {
        category: 'Navigation',
        description: 'Change le dossier courant',
        synopsis: 'cd',
        helpOption: "<dossier>",
        options: [
            'cd .. : remonte d\'un niveau',
            'cd ~ : va au répertoire home',
            'cd - : retourne au répertoire précédent'
        ],
        examples: ['cd /home/user', 'cd ..', 'cd ~']
    },
    ls: {
        category: 'Navigation',
        description: 'Liste le contenu du dossier',
        synopsis: 'ls',
        helpOption: "[dossier]",
        options: [
            '-l : format de liste détaillée',
            '-a : affiche tous les fichiers (y compris cachés)',
            '-h : tailles lisibles par l\'homme'
        ],
        examples: ['ls', 'ls /home', 'ls -l']
    },

    // Fichiers & Dossiers
    cat: {
        category: 'Fichiers & Dossiers',
        description: 'Affiche le contenu d\'un fichier',
        synopsis: 'cat',
        helpOption: "<fichier>",
        options: ['--help : affiche cette aide et quitte'],
        examples: ['cat fichier.txt', 'cat file1 file2']
    },
    mkdir: {
        category: 'Fichiers & Dossiers',
        description: 'Crée un dossier',
        synopsis: 'mkdir',
        helpOption: "<dossier>",
        options: ['-p : crée les répertoires parents si nécessaire'],
        examples: ['mkdir nouveau_dossier', 'mkdir -p dossier/sous-dossier']
    },
    touch: {
        category: 'Fichiers & Dossiers',
        description: 'Crée un fichier vide',
        synopsis: 'touch',
        helpOption: "<fichier>",
        options: [],
        examples: ['touch nouveau_fichier.txt']
    },
    rm: {
        category: 'Fichiers & Dossiers',
        description: 'Supprime un fichier ou dossier',
        synopsis: 'rm',
        helpOption: "<fichier/dossier>",
        options: [
            '-r : suppression récursive',
            '-f : force la suppression'
        ],
        examples: ['rm fichier.txt', 'rm -r dossier/']
    },
    edit: {
        category: 'Fichiers & Dossiers',
        description: 'Édite un fichier avec un éditeur riche',
        synopsis: 'edit',
        helpOption: "<fichier>",
        options: [],
        examples: ['edit mon_fichier.txt']
    },
    find: {
        category: 'Fichiers & Dossiers',
        description: 'Recherche des fichiers et dossiers',
        synopsis: 'find',
        helpOption: "[options] <chemin>",
        options: [
            '-name motif : recherche par nom',
            '-type f : recherche seulement les fichiers',
            '-type d : recherche seulement les répertoires',
            '-maxdepth N : limite la profondeur de recherche'
        ],
        examples: ['find . -name "*.txt"', 'find /home -type d']
    },
    cp: {
        category: 'Fichiers & Dossiers',
        description: 'Copie un fichier ou dossier',
        synopsis: 'cp',
        helpOption: "<source> <dest>",
        options: ['-r : copie récursive'],
        examples: ['cp fichier.txt copie.txt', 'cp -r dossier/ nouveau_dossier/']
    },
    mv: {
        category: 'Fichiers & Dossiers',
        description: 'Déplace/renomme un fichier ou dossier',
        synopsis: 'mv',
        helpOption: "<source> <dest>",
        options: [],
        examples: ['mv ancien.txt nouveau.txt', 'mv fichier.txt /autre/dossier/']
    },

    // Utilitaires
    echo: {
        category: 'Utilitaires',
        description: 'Affiche un message dans la console',
        synopsis: 'echo',
        helpOption: "<message>",
        options: [
            '-o : affiche en version "old" (ancienne)',
            '-- old : affiche en version "old" (ancienne)',
        ],
        examples: ['echo "Hello World"', 'echo -n "No newline"']
    },
    clear: {
        category: 'Utilitaires',
        description: 'Efface la console',
        synopsis: 'clear',
        helpOption: "None",
        options: [],
        examples: ['clear']
    },
    help: {
        category: 'Utilitaires',
        description: 'Affiche cette aide',
        synopsis: 'help',
        helpOption: "None",
        options: [],
        examples: ['help']
    },
    about: {
        category: 'Utilitaires',
        description: 'À propos de la console',
        synopsis: 'about',
        helpOption: "None",
        options: [],
        examples: ['about']
    },
    cconnect: {
        category: 'Utilitaires',
        description: 'Change de pseudo utilisateur',
        synopsis: 'cconnect',
        helpOption: "<username>",
        options: [],
        examples: ['cconnect john', 'cconnect admin']
    },
    cdisconnect: {
        category: 'Utilitaires',
        description: 'Déconnecte l\'utilisateur',
        synopsis: 'cdisconnect',
        helpOption: "None",
        options: [],
        examples: ['cdisconnect']
    },
    history: {
        category: 'Utilitaires',
        description: 'Affiche l\'historique des commandes',
        synopsis: 'history',
        helpOption: "None",
        options: [],
        examples: ['history']
    },
    github: {
        category: 'Utilitaires',
        description: 'Lien vers le dépôt GitHub du projet',
        synopsis: 'github',
        helpOption: "None",
        options: [],
        examples: ['github']
    },
    tree: {
        category: 'Utilitaires',
        description: 'Affiche l\'arborescence des dossiers',
        synopsis: 'tree',
        helpOption: "[options] [chemin]",
        options: [
            '-a : affiche tous les fichiers',
            '-d : affiche seulement les répertoires',
            '-L niveau : limite la profondeur d\'affichage'
        ],
        examples: ['tree', 'tree -L 2', 'tree -d']
    },
    grep: {
        category: 'Utilitaires',
        description: 'Recherche un motif dans un fichier',
        synopsis: 'grep',
        helpOption: "[options] <motif> <fichier>",
        options: [
            '-i : ignore la casse',
            '-n : affiche les numéros de ligne',
            '-v : inverse la correspondance',
            '-c : compte les correspondances'
        ],
        examples: ['grep "hello" fichier.txt', 'grep -i "error" log.txt']
    },
    version: {
        category: 'Utilitaires',
        description: 'Affiche la version de la console',
        synopsis: 'version',
        helpOption: "None",
        options: [],
        examples: ['version']
    },
    versionbump: {
        category: 'Utilitaires',
        description: 'Incrémente la version (patch par défaut)',
        synopsis: 'versionbump',
        helpOption: "[type] [changelog]",
        options: [
            'major : incrémente la version majeure (x.0.0)',
            'minor : incrémente la version mineure (x.y.0)',
            'patch : incrémente la version patch (x.y.z) - par défaut'
        ],
        examples: ['versionbump "Correction de bugs"', 'versionbump major "Nouvelle version majeure"', 'versionbump minor "Nouvelles fonctionnalités"']
    },
    changelog: {
        category: 'Utilitaires',
        description: 'Affiche ou modifie le changelog actuel',
        synopsis: 'changelog',
        helpOption: "[nouveau_changelog]",
        options: [],
        examples: ['changelog', 'changelog "Nouveau message de changelog"']
    },
    versionhistory: {
        category: 'Utilitaires',
        description: 'Affiche l\'historique des versions',
        synopsis: 'versionhistory',
        helpOption: "[nombre]",
        options: [
            'nombre : limite le nombre de versions affichées'
        ],
        examples: ['versionhistory', 'versionhistory 5']
    },
    wc: {
        category: 'Utilitaires',
        description: 'Compte les lignes, mots et caractères',
        synopsis: 'wc',
        helpOption: "[options] <fichier>",
        options: [
            '-l : compte seulement les lignes',
            '-w : compte seulement les mots',
            '-c : compte seulement les bytes',
            '-m : compte seulement les caractères'
        ],
        examples: ['wc fichier.txt', 'wc -l document.txt']
    },
    date: {
        category: 'Utilitaires',
        description: 'Affiche la date et l\'heure',
        synopsis: 'date',
        helpOption: "[options]",
        options: [
            '-u : affiche l\'heure UTC',
            '-R : format RFC 2822',
            '-I : format ISO 8601',
            '+format : format personnalisé'
        ],
        examples: ['date', 'date -u', 'date "+%Y-%m-%d"']
    },
    sudo: {
        category: 'Utilitaires',
        description: 'Exécute une commande avec privilèges admin',
        synopsis: 'sudo',
        helpOption: "<commande>",
        options: [],
        examples: ['sudo ls /root']
    },
    man: {
        category: 'Utilitaires',
        description: 'Affiche le manuel d\'une commande',
        synopsis: 'man',
        helpOption: "[commande]",
        options: [
            'man : affiche la liste des manuels disponibles',
            'man [commande] : affiche le manuel de la commande'
        ],
        examples: ['man', 'man ls', 'man grep']
    },
    whoami: {
        category: 'Utilitaires',
        description: 'Affiche l\'utilisateur actuel',
        synopsis: 'whoami',
        helpOption: "None",
        options: [],
        examples: ['whoami']
    },
    uptime: {
        category: 'Utilitaires',
        description: 'Affiche le temps de fonctionnement du système',
        synopsis: 'uptime',
        helpOption: "None",
        options: [],
        examples: ['uptime']
    },
    calc: {
        category: 'Utilitaires',
        description: 'Ouvre une calculatrice en ligne de commande',
        synopsis: 'calc',
        helpOption: "None",
        options: [],
        examples: ['calc', 'calc 2+2', 'calc 5*3']
    },
    genpass : {
        category: 'Utilitaires',
        description: 'Génère un mot de passe aléatoire',
        synopsis: 'genpass',
        helpOption: "[longueur]",
        options: [
            '-l : spécifie la longueur du mot de passe (par défaut 12)',
            '-s : inclut des caractères spéciaux'
        ],
        examples: ['genpass', 'genpass -l 16', 'genpass -s']
    },
    fullscreen: {
        category: 'Utilitaires',
        description: 'Bascule en mode plein écran',
        synopsis: 'fullscreen',
        helpOption: "None",
        options: [],
        examples: ['fullscreen']
    },
    qrcode: {
        description: "Génère un QR Code à partir d'un texte",
        category: "Outils",
        synopsis: "qrcode [OPTIONS] <texte>",
        helpOption: "-h, --help",
        options: [
            "-s, --size <taille>     Taille du QR Code en pixels (50-1000, défaut: 200)",
            "-c, --color <couleur>   Couleur du QR Code en hexadécimal (défaut: 000000)",
            "-b, --bgcolor <couleur> Couleur de fond en hexadécimal (défaut: ffffff)",
            "-f, --format <format>   Format de sortie: png, jpg, gif, svg (défaut: png)",
            "-e, --error-level <lvl> Niveau de correction d'erreur: L, M, Q, H (défaut: M)",
            "-h, --help              Affiche cette aide"
        ],
        examples: [
            "qrcode \"https://example.com\"",
            "qrcode -s 300 -c ff0000 \"Mon texte\"",
            "qrcode -f svg -e H \"Texte important\""
        ],
        seeAlso: ["base64", "curl", "wget"]
    },

    // Système & Processus
    ps: {
        category: 'Système & Processus',
        description: 'Affiche les processus en cours',
        synopsis: 'ps',
        helpOption: "[options]",
        options: [
            '-a : affiche tous les processus',
            '-u : format utilisateur',
            '-x : inclut les processus sans TTY',
            '-f : format complet'
        ],
        examples: ['ps', 'ps aux', 'ps -ef']
    },
    top: {
        category: 'Système & Processus',
        description: 'Affiche les processus actifs en temps réel',
        synopsis: 'top',
        helpOption: "None",
        options: [],
        examples: ['top']
    },
    free: {
        category: 'Système & Processus',
        description: 'Affiche l\'utilisation de la mémoire',
        synopsis: 'free',
        helpOption: "[options]",
        options: [
            '-h : format lisible par l\'homme',
            '-b : affichage en bytes',
            '-m : affichage en mégabytes',
            '-g : affichage en gigabytes'
        ],
        examples: ['free', 'free -h', 'free -m']
    },
    df: {
        category: 'Système & Processus',
        description: 'Affiche l\'espace disque disponible',
        synopsis: 'df',
        helpOption: "[options]",
        options: [
            '-h : format lisible par l\'homme',
            '-T : affiche le type de système de fichiers',
            '-a : affiche tous les systèmes de fichiers'
        ],
        examples: ['df', 'df -h', 'df -T']
    },
    kill: {
        category: 'Système & Processus',
        description: 'Termine un processus par son PID',
        synopsis: 'kill',
        helpOption: "<pid>",
        options: [],
        examples: ['kill 1234', 'kill -9 5678']
    },
    killall: {
        category: 'Système & Processus',
        description: 'Termine tous les processus par nom',
        synopsis: 'killall',
        helpOption: "<nom>",
        options: [],
        examples: ['killall firefox', 'killall -9 chrome']
    },
    reboot: {
        category: 'Système & Processus',
        description: 'Redémarre le système',
        synopsis: 'reboot',
        helpOption: "None",
        options: [],
        examples: ['reboot']
    },
    notify: {
        category: 'Système & Processus',
        description: 'Affiche une notification système',
        synopsis: 'notify',
        helpOption: "[options] <message>",
        options: [
            '-t, --type TYPE : type de notification (info, success, warning, error)',
            '-T, --title TITRE : titre personnalisé de la notification',
            '-d, --duration MS : durée d\'affichage en millisecondes (0 = permanent)',
            '-p, --persistent : notification permanente (équivalent à -d 0)',
            '-a, --action TEXT : ajouter un bouton d\'action',
            '-h, --help : afficher cette aide et quitter'
        ],
        examples: [
            'notify "Hello World"',
            'notify -t success "Opération réussie"',
            'notify -t error -T "Erreur" "Problème"',
            'notify -p "Message permanent"',
            'notify -d 10000 "10 secondes"',
            'notify -a "OK" "Avec bouton"'
        ]
    },
    checkFile: {
        category: 'Système & Processus',
        description: 'Vérifie l\'existence d\'un fichier',
        synopsis: 'checkFile',
        helpOption: "<fichier>",
        options: [],
        examples: ['checkFile mon_fichier.txt', 'checkFile /chemin/vers/fichier']
    },

    // Gestion Internet
    lshw: {
        category: 'Gestion Internet',
        description: 'Affiche des informations matérielles sur le navigateur',
        synopsis: 'lshw',
        helpOption: "None",
        options: [],
        examples: ['lshw']
    },
    ifconfig: {
        category: 'Gestion Internet',
        description: 'Affiche la configuration réseau accessible',
        synopsis: 'ifconfig',
        helpOption: "None",
        options: [],
        examples: ['ifconfig']
    },
    ping: {
        category: 'Gestion Internet',
        description: 'Teste la connectivité réseau',
        synopsis: 'ping',
        helpOption: "<adresse>",
        options: [],
        examples: ['ping google.com', 'ping 8.8.8.8']
    },
    wget: {
        category: 'Gestion Internet',
        description: 'Télécharge un fichier depuis une URL',
        synopsis: 'wget',
        helpOption: "<url>",
        options: [],
        examples: ['wget https://example.com/file.txt']
    },
    curl: {
        category: 'Gestion Internet',
        description: 'Transfère des données depuis/vers un serveur',
        synopsis: 'curl',
        helpOption: "[options] <url>",
        options: [
            '-I : méthode HEAD seulement',
            '-o fichier : sauvegarde dans un fichier',
            '-v : mode verbeux'
        ],
        examples: ['curl https://api.example.com', 'curl -I https://google.com']
    },

    // Gestion du cache
    cookies: {
        category: 'Gestion du cache',
        description: 'Affiche les cookies stockés et tout les informations de liées',
        synopsis: 'cookies',
        helpOption: "None",
        options: [],
        examples: ['cookies']
    },
    clearHistory: {
        category: 'Gestion du cache',
        description: 'Efface l\'historique des commandes',
        synopsis: 'clearHistory',
        helpOption: "None",
        options: [],
        examples: ['clearHistory']
    },
    resetAllCache: {
        category: 'Gestion du cache',
        description: 'Efface tous les cookies, le cache et l\'historique',
        synopsis: 'resetAllCache',
        helpOption: "None",
        options: [],
        examples: ['resetAllCache']
    },

    // Divertissement & Jeux
    cowsay: {
        category: 'Divertissement & Jeux',
        description: 'Affiche un message avec une vache ASCII',
        synopsis: 'cowsay',
        helpOption: "<message>",
        options: [],
        examples: ['cowsay "Hello World"', 'cowsay "Moo!"']
    },
    figlet: {
        category: 'Divertissement & Jeux',
        description: 'Génère du texte ASCII art',
        synopsis: 'figlet',
        helpOption: "<texte>",
        options: [],
        examples: ['figlet HELLO', 'figlet "ASCII ART"']
    },
    fortune: {
        category: 'Divertissement & Jeux',
        description: 'Affiche une citation aléatoire',
        synopsis: 'fortune',
        helpOption: "None",
        options: [],
        examples: ['fortune']
    },
    cmatrix: {
        category: 'Divertissement & Jeux',
        description: 'Simulation de Matrix dans le terminal',
        synopsis: 'cmatrix',
        helpOption: "None",
        options: ['q : quitter la simulation'],
        examples: ['cmatrix']
    },


    // Interface
    newtab: {
        category: 'Interface',
        description: 'Créer un nouvel onglet',
        synopsis: 'newtab',
        helpOption: '[titre]',
        options: [
            '[titre] - titre optionnel pour le nouvel onglet'
        ],
        examples: [
            'newtab',
            'newtab "Serveur Web"',
            'newtab Development'
        ]
    },
    
    closetab: {
        category: 'Interface',
        description: 'Fermer un onglet',
        synopsis: 'closetab',
        helpOption: '[numéro]',
        options: [
            '[numéro] - numéro de l\'onglet à fermer (par défaut: onglet actuel)'
        ],
        examples: [
            'closetab',
            'closetab 2'
        ]
    },
    
    renametab: {
        category: 'Interface',
        description: 'Renommer l\'onglet actuel',
        synopsis: 'renametab',
        helpOption: '[nouveau nom]',
        options: [
            '<nouveau nom> - nouveau nom pour l\'onglet'
        ],
        examples: [
            'renametab "Mon Terminal"',
            'renametab Production'
        ]
    },
    
    listtabs: {
        category: 'Interface',
        description: 'Lister tous les onglets',
        synopsis: 'listtabs',
        helpOption: '',
        options: [],
        examples: ['listtabs']
    },
    
    switchtab: {
        category: 'Interface',
        description: 'Basculer vers un onglet spécifique',
        synopsis: 'switchtab',
        helpOption: '[numéro]',
        options: [
            '<numéro> - numéro de l\'onglet (1-N)'
        ],
        examples: [
            'switchtab 1',
            'switchtab 3'
        ]
    },
};

// --- Helper Functions for Command Display ---
const commandHelpers = {
    // Génère le HTML pour afficher une commande avec ses options
    formatCommand(cmdName, metadata) {
        // Gestion du helpOption pour affichage console (texte brut)
        let argsText = '';
        if (metadata.helpOption && metadata.helpOption !== "None") {
            argsText = ` ${metadata.helpOption.replace(/</g, '&lt;').replace(/>/g, '&gt;')}`;
        }
        return `${cmdName}${argsText} - ${metadata.description}`;
    },

    // Groupe les commandes par catégorie
    groupCommandsByCategory() {
        const grouped = {};
        Object.entries(COMMAND_METADATA).forEach(([cmdName, metadata]) => {
            if (!grouped[metadata.category]) {
                grouped[metadata.category] = [];
            }
            grouped[metadata.category].push(cmdName);
        });
        return grouped;
    },

    // Ordre des catégories pour l'affichage
    getCategoryOrder() {
        return [
            'Interface',
            'Navigation',
            'Fichiers & Dossiers', 
            'Utilitaires',
            'Système & Processus',
            'Gestion Internet',
            'Importation de commandes',
            'Gestion du cache',
            'Divertissement & Jeux'
        ];
    },

    // Icônes pour les catégories
    getCategoryIcon(category) {
        const icons = {
            'Interface': '🖱️',
            'Navigation': '🗂️',
            'Fichiers & Dossiers': '📁',
            'Utilitaires': '🛠️',
            'Système & Processus': '⚙️',
            'Gestion Internet': '🌐',
            'Importation de commandes': '📦',
            'Gestion du cache': '🧹',
            'Divertissement & Jeux': '🎮'
        };
        return icons[category] || '📋';
    }
};

export { COMMAND_METADATA, commandHelpers };